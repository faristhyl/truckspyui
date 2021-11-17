import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ModalDirective } from 'ngx-bootstrap';

import { RestService, NotificationSettingsList, NotificationType, EntityTypeUtil, NotificationSettings, SupportedEntity } from '@app/core/services'
import { defer } from 'rxjs';

@Component({
  selector: 'app-notification-settings',
  templateUrl: './notification-settings.component.html',
  styleUrls: ['./notification-settings.component.css']
})
export class NotificationSettingsComponent implements OnInit {

  nsList: NotificationSettingsList;
  nsTypes: NotificationType[];
  hierarchy: any;

  /**
   * Remove Notification Settings modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("removeSettingsModal") _removeSettingsModal: ModalDirective;
  forSettings: NotificationSettings;

  initRemoveSettingsModal(settings: NotificationSettings) {
    this.forSettings = settings;
    this._removeSettingsModal.show();
  }
  closeRemoveSettingsModal() {
    this._removeSettingsModal.hide();
  }

  removeSettings(settingsId: string) {
    this.restService.deleteNotificationSettings(settingsId)
      .subscribe(result => {
        this._removeSettingsModal.hide();
        this.loadNotificationSettings();
      });
  }

  /**
   * Add Notification Settings modal reference to operate with within component.
   * @type {BsModalRef}
   */
  _addSettingsModal: BsModalRef;
  settingsData: any = {};
  notificationTypes: string[];
  entities: SupportedEntity[];
  communicationTypes: string[];
  supportedAttributes: string[];

  editId: string = null; // for editing notification setting

  ccEmailsData: any[];

  reportReadyData: any;
  reportNames: string[];
  fileTypes: string[];

  addSettings(template: TemplateRef<any>) {
    this.editId = null;
    this.ccEmailsData = [];
    this.settingsData = {
      notificationType: (this.notificationTypes && this.notificationTypes.length >= 1 && this.notificationTypes[0]) || ""
    };
    this.onTypeChange(this.settingsData["notificationType"]);
    this._addSettingsModal = this.modalService.show(template, { class: "modal-600" });
  }

  editSettings(template: TemplateRef<any>, settingsItem: NotificationSettings) {
    this.editId = settingsItem.id;
    this.ccEmailsData = (settingsItem.ccEmailList || []).map((email, idx) => {
      return { id: idx + 1, email };
    });
    this.settingsData = {
      notificationType: settingsItem.notificationType,
      communicationType: settingsItem.communicationType,
      entityId_: settingsItem.entityId, // will be calculated used for calculation and vanished
      reportName_: settingsItem.getAttributeValue("reportName"), // will be calculated used for calculation and vanished
      fileType_: settingsItem.getAttributeValue("fileType"), // will be calculated used for calculation and vanished
    };
    this.onTypeChange(this.settingsData["notificationType"]);
    this._addSettingsModal = this.modalService.show(template, { class: "modal-600" });
  }

  /**
   * Unique ID holder to utilize within view for name/id fields (avoiding view mixed up for input values).
   */
  addCcEmailData() {
    let emailData = {
      id: this.ccEmailsData ? this.ccEmailsData.length + 1 : 1,
      email: null,
    };
    this.ccEmailsData.push(emailData);
  }

  removeCcEmailData(index) {
    this.ccEmailsData.splice(index, 1);
  }

  isReportReady() {
    return this.settingsData["notificationType"] === "Report_Ready"
  }

  isCommunicationEmail() {
    return this.settingsData["communicationType"] === "Email"
  }

  onTypeChange(newType) {
    let type = this.nsTypes.find(function (nsType) {
      return newType === nsType.notificationType;
    });
    this.supportedAttributes = type.supportedAttributes;
    this.communicationTypes = type.supportedCommunications || [];

    let presented = this.communicationTypes.includes(this.settingsData["communicationType"]);
    if (!presented) {
      this.settingsData["communicationType"] = (this.communicationTypes.length >= 1 && this.communicationTypes[0]) || ""
    }

    this.entities = type.supportedEntities || [];
    const entityId_ = this.settingsData.entityId_ || (this.settingsData.entity && this.settingsData.entity.entityId);
    let entity = this.entities.find(function (entity) {
      return entityId_ === entity.entityId;
    });
    delete this.settingsData.entityId_;

    this.settingsData["entity"] = entity || (this.entities.length >= 1 && this.entities[0]) || null;
    this.onEntityChange(this.settingsData["entity"]);
  }

  onEntityChange(newEntity: SupportedEntity) {
    if (this.isReportReady()) {
      this.restService.getReport_ReadyValidSettingsFor(newEntity.entityId)
        .subscribe(
          data => {
            this.reportReadyData = data;
            this.reportNames = data.map(next => next.reportName);
            this.settingsData["reportName"] = this.settingsData.reportName_ || (this.reportNames && this.reportNames.length >= 1 && this.reportNames[0]) || ""
            delete this.settingsData.reportName_;
            this.onReportNameChange(this.settingsData["reportName"]);
          },
          error => {
            this.reportReadyData = [];
            this.reportNames = [];
            this.fileTypes = [];
            this.settingsData["reportName"] = null;
            this.settingsData["fileType"] = null;
          }
        );
    } else {
      this.reportReadyData = [];
      this.reportNames = [];
      this.fileTypes = [];
      this.settingsData["reportName"] = null;
      this.settingsData["fileType"] = null;
    }
  }

  onReportNameChange(newReportName) {
    let entry = this.reportReadyData.find(function (next) {
      return newReportName === next.reportName;
    });
    this.fileTypes = entry.fileTypes;
    this.settingsData["fileType"] = this.settingsData.fileType_ || (this.fileTypes && this.fileTypes.length >= 1 && this.fileTypes[0]) || "";
    delete this.settingsData.fileType_;
  }

  createOrUpdateSettings(): void {
    let data = {
      notificationType: this.settingsData["notificationType"],
      communicationType: this.settingsData["communicationType"],
      entityId: this.settingsData["entity"].entityId,
      entityType: this.settingsData["entity"].entityType,
      attributes: {},
      ccEmailList: []
    }

    if (this.settingsData["reportName"]) {
      data.attributes = {
        reportName: this.settingsData["reportName"],
        fileType: this.settingsData["fileType"],
      }
    }

    if (this.isCommunicationEmail()) {
      data.ccEmailList = this.ccEmailsData.map(c => c.email);
    }

    defer(() => this.editId ? 
                this.restService.updateNotificationSettings(this.editId, data) :
                this.restService.createNotificationSettings(data)
    ).subscribe(data => {
      this._addSettingsModal.hide();
      this.loadNotificationSettings();
    });
  }
  
  closeAddSettingsModal(): void {
    this._addSettingsModal.hide();
  }

  /**
   * Constructor to instantiate an instance of NotificationSettingsComponent.
   */
  constructor(
    private restService: RestService,
    private modalService: BsModalService) { }

  calculateURI(theMap) {
    let type = EntityTypeUtil.getEntityType(theMap.entityType);
    return EntityTypeUtil.getURI(type, theMap.entityId);
  }

  ngOnInit() {
    this.restService.getNotificationSettingsTypes()
      .subscribe(
        types => {
          this.nsTypes = types;
          this.notificationTypes = this.nsTypes.map(type => type.notificationType);
          this.loadNotificationSettings();
        }
      );
  }

  private loadNotificationSettings() {
    this.restService.getNotificationSettingsList()
      .subscribe(
        list => {
          this.nsList = list;
          this.hierarchy = this.nsList.prepareUIHierarchy(this.nsTypes);
        }
      );
  }

}