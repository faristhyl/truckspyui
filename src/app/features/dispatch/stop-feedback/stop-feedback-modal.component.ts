import { Component, Input, TemplateRef, OnInit } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { Stop, RestService, Feedback } from '@app/core/services/rest.service';

@Component({
    selector: 'app-stop-feedback-modal',
    templateUrl: './stop-feedback-modal.component.html'
})
export class StopFeedbackModalComponent implements OnInit {

    @Input() stop: Stop;
    feedbacks: Feedback[];

    constructor(
        private restService: RestService,
        private modalService: BsModalService) {
    }

    ngOnInit() { }

    /**
     * Stop Feedback modal reference to operate with within component.
     * @type {BsModalRef}
     */
    _feedbacksModal: BsModalRef;
    showFeedbacksModal(template: TemplateRef<any>) {
        this.restService.getFeedbacksFor(this.stop.id)
            .subscribe(
                data => {
                    this.feedbacks = data;
                    this._feedbacksModal = this.modalService.show(template, { class: "modal-lg" });
                }
            );
    }
    closeFeedbacksModal(): void {
        this._feedbacksModal.hide();
    }

}
