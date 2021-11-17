import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';

import {
  RestService, MaintenanceIssue, IssueStatus, IssueSourceType, Inspection, FaultRule, MaintenanceItem, IssueSource, Answer,
  WorkOrder, User
} from '@app/core/services'
import { LongActionLinkComponent } from '@app/features/shared/long-action-link.component';

@Component({
  selector: 'app-maintenance-issue-view',
  templateUrl: './maintenance-issue-view.component.html',
  styleUrls: ['./maintenance-issue-view.component.css']
})
export class MaintenanceIssueViewComponent implements OnInit {

  issueId: string;
  issue: MaintenanceIssue = new MaintenanceIssue();
  loaded: boolean = false;

  inspection: Inspection;
  faultRule: FaultRule;
  maintenanceItem: MaintenanceItem;
  user: User;

  answerImage: any;
  answerImageLoading: boolean;
  answer: Answer;

  orders: WorkOrder[];
  ordersLoaded: boolean = false;

  /**
   * Constructor to instantiate an instance of MaintenanceIssueViewComponent.
   */
  constructor(
    private route: ActivatedRoute,
    private modalService: BsModalService,
    private restService: RestService) { }

  ngOnInit() {
    this.issueId = this.route.snapshot.paramMap.get("id");
    this.restService.getMaintenanceIssue(this.issueId)
      .subscribe(result => {
        this.newIssue(result);
        this.loaded = true;

        const theSource = this.issue.source;
        if (theSource && theSource.id) {
          this.loadSourceEntity(theSource);
        }

        this.restService.get1000WorkOrdersByVehicle(this.issue.vehicle.id)
          .subscribe(result => {
            this.orders = result.filter(next => next.isAssignableTo());
            this.ordersLoaded = true;
          });
      });
  }

  newIssue(theIssue) {
    this.issue = theIssue;
    this.allowedConversions[IssueStatus.NEW] = !theIssue.repairOrder
      ? [IssueStatus.ASSIGNED, IssueStatus.ON_HOLD, IssueStatus.REPAIRED, IssueStatus.NOT_ACTIONABLE]
      : [IssueStatus.ASSIGNED, IssueStatus.ON_HOLD, IssueStatus.REPAIRED];
  }

  loadSourceEntity(theSource: IssueSource) {
    const entityId = theSource.id;
    const entityType = theSource.type;
    this.inspection = null;
    this.faultRule = null;
    this.maintenanceItem = null;
    this.user = null;

    if (entityType === IssueSourceType.DRIVER_INSPECTION) {
      this.restService.getInspectionByAnswer(entityId)
        .subscribe(result => {
          this.inspection = result;
          this.answer = this.inspection.getAnswer(entityId);
          this.loadAnswerImage(this.inspection.id, entityId);
        });
    } else if (entityType === IssueSourceType.ENGINE_FAULT) {
      this.restService.getFaultRule(entityId)
        .subscribe(result => {
          this.faultRule = result;
        });
    } else if (entityType === IssueSourceType.SCHEDULED_MAINTENANCE) {
      this.restService.getMaintenanceItem(entityId)
        .subscribe(result => {
          this.maintenanceItem = result;
        });
    } else if (entityType === IssueSourceType.USER_CREATED) {
      this.restService.getUser(entityId)
        .subscribe(result => {
          this.user = result;
        });
    }
  }

  loadAnswerImage(inspectionId: string, answerId: string) {
    this.answerImageLoading = true;
    this.answerImage = undefined;
    this.restService.getAnswerImage(inspectionId, answerId)
      .subscribe(
        blob => {
          this.blobToImage(blob);
          this.answerImageLoading = false;
        },
        error => {
          this.answerImage = 'error'
          this.answerImageLoading = false;
        });
  }

  blobToImage(image: Blob) {
    const self = this;
    let reader = new FileReader();
    reader.addEventListener("load", () => {
      this.answerImage = reader.result;
    }, false);

    if (image) {
      reader.readAsDataURL(image);
    }
  }

  allowedConversions: { [key in IssueStatus]?: IssueStatus[] } = {
    // [IssueStatus.NEW]: [IssueStatus.ASSIGNED, IssueStatus.ON_HOLD, IssueStatus.REPAIRED, IssueStatus.NOT_ACTIONABLE],
    [IssueStatus.ASSIGNED]: [IssueStatus.ON_HOLD, IssueStatus.REPAIRED],
    [IssueStatus.ON_HOLD]: [IssueStatus.ASSIGNED, IssueStatus.REPAIRED],
    [IssueStatus.REPAIRED]: [IssueStatus.RESOLVED],
    [IssueStatus.RESOLVED]: []
  };
  statusChangeInitiated: boolean = false;

  /**
   * Set Issue status logic.
   */
  doChangeStatus(toStatus: IssueStatus, actionComponent: LongActionLinkComponent) {
    this.statusChangeInitiated = true;
    this.restService.setMaintenanceIssueStatus(this.issueId, toStatus)
      .subscribe(
        updated => {
          this.newIssue(updated);
          this.statusChangeInitiated = false;
          actionComponent.actionFinished();
        },
        error => {
          actionComponent.actionFailed();
          this.statusChangeInitiated = false;
        }
      );
  }

  /**
   * Unassign Isse from the Work Order.
   */
  doUnassign(order: WorkOrder, actionComponent: LongActionLinkComponent) {
    this.restService.unassignIssueFromWorkOrder(order.id, this.issueId)
      .subscribe(
        updatedOrder => {
          // Let's reload issue:
          this.restService.getMaintenanceIssue(this.issueId)
            .subscribe(result => {
              this.newIssue(result);
              actionComponent.actionFinished();
            });
        },
        error => {
          actionComponent.actionFailed();
        }
      );
  }

  /**
   * Assign Isse to the Work Order modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _assignModal: BsModalRef;
  assignData = {
    orderId: "",
    createOrder: false
  };
  ordersAvailable: boolean = false;

  /**
   * Workaround for the SmartAdmin select2 wrappers.
   */
  orderChanged(value) {
    this.assignData.orderId = value;
  }

  assign(template: TemplateRef<any>) {
    this.ordersAvailable = this.orders && this.orders.length >= 1;
    this.assignData = {
      orderId: (this.ordersAvailable && this.orders[0].id) || null,
      createOrder: !this.ordersAvailable
    };

    this._assignModal = this.modalService.show(template, { class: "modal-450" });
  }

  doAssign(): void {
    if (this.assignData.createOrder) {
      this.restService.createWorkOrder(this.issue.vehicle.id)
        .subscribe(
          theOrder => {
            this.orders = [... this.orders, theOrder]; // Better to updatehandle here instead of loading orders list everytime
            this.restService.assignIssueToWorkOrder(theOrder.id, this.issueId)
              .subscribe(
                updatedOrder => {
                  // Let's reload issue:
                  this.restService.getMaintenanceIssue(this.issueId)
                    .subscribe(result => {
                      this.newIssue(result);
                      this._assignModal.hide();
                    });
                });
          });
    } else {
      this.restService.assignIssueToWorkOrder(this.assignData.orderId, this.issueId)
        .subscribe(
          updatedOrder => {
            // Let's reload issue:
            this.restService.getMaintenanceIssue(this.issueId)
              .subscribe(result => {
                this.newIssue(result);
                this._assignModal.hide();
              });
          });
    }
  }
  closeAssignModal(): void {
    this._assignModal.hide();
  }

  /**
   * Comments editing logic
   */
  isUpdateComments: boolean;
  editedComments: string;

  beginEditComments() {
    this.isUpdateComments = true;
    this.editedComments = this.issue.comments ? this.issue.comments : "";
  }
  onUpdateComments() {
    this.restService.updateMaintenanceIssueComments(this.issue.id, this.editedComments)
      .subscribe(result => {
        if (result) {
          this.newIssue(result);
          this.cancelEditComments();
        }
      })
  }
  cancelEditComments() {
    this.isUpdateComments = false;
    this.editedComments = "";
  }

}
