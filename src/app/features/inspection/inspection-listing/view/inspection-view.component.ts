import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalDirective } from 'ngx-bootstrap';

import { RestService, Inspection, Answer } from '@app/core/services';
import * as fileSaver from 'file-saver';

@Component({
  selector: 'app-inspection-view',
  templateUrl: './inspection-view.component.html',
  styleUrls: ['./inspection-view.component.css']
})
export class InspectionViewComponent implements OnInit {

  inspectionId: any;
  inspection: Inspection;

  driverSignature: any;
  driverSignatureLoading: boolean;

  answerImage: any;
  answerImageLoading: boolean;

  constructor(
    private route: ActivatedRoute,
    private restService: RestService,
    private router: Router) {
  }

  ngOnInit() {
    this.inspectionId = this.route.snapshot.paramMap.get("id");

    this.restService.getInspection(this.inspectionId)
      .subscribe(result => {
        this.inspection = result;
        this.getSignature();
      })
  }

  getSignature() {
    this.driverSignatureLoading = true;
    this.driverSignature = undefined;
    this.restService.getInspectionSignature(this.inspectionId)
      .subscribe(
        blob => {
          this.blobToImage(blob, "driverSignature");
          this.driverSignatureLoading = false;
        },
        error => {
          this.driverSignature = 'error'
          this.driverSignatureLoading = false;
        });
  }

  showActionStarted: boolean = false;
  showHideAnswer(answer, index) {
    this.showActionStarted = true;
    this.inspection.answers.forEach((next: Answer, i) => {
      if (i !== index) {
        next.show = false;
      }
    })
    if (answer.show === false) {
      this.answerImageLoading = true;
      this.answerImage = undefined;
      this.restService.getAnswerImage(this.inspectionId, answer.id)
        .subscribe(
          blob => {
            this.blobToImage(blob, "answerImage");
            this.answerImageLoading = false;
            this.inspection.answers[index].show = true
            this.showActionStarted = false;
          },
          error => {
            this.answerImage = 'error'
            this.answerImageLoading = false;
            this.inspection.answers[index].show = true
            this.showActionStarted = false;
          });
    } else {
      this.inspection.answers[index].show = false
      this.showActionStarted = false;
    }
  }

  blobToImage(image: Blob, source) {
    const self = this;
    let reader = new FileReader();
    reader.addEventListener("load", () => {
      self[source] = reader.result;
    }, false);

    if (image) {
      reader.readAsDataURL(image);
    }
  }

  onDownloadPDF() {
    this.restService.downloadInspectionById(this.inspectionId, 'PDF')
      .subscribe(response => {
        fileSaver(response, `inspection-${this.inspection.getNum()}.pdf`);
      })
  }

  /**
   * Answer Image modal directive reference to operate with within component.
   * @type {ModalDirective}
   */
  @ViewChild("answerImageModal") _answerImageModal: ModalDirective;

  showAnswerImageModal() {
    this._answerImageModal.show();
  }
  closeAnswerImageModal() {
    this._answerImageModal.hide();
  }

}
