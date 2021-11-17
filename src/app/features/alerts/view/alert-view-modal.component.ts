import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { plainToClass } from "class-transformer";

import {
    DriveAlert, RestService, AlertVideo, Driver, DriveAlertStatus, DriveAlertComment, User, LocalStorageService, Company
} from '@app/core/services/rest.service';
import { getUser, AuthState, LoggedInAs, LoggedOutAs } from '@app/core/store/auth';
import { getConfigCompany } from '@app/core/store/config';
import { ConfigState } from '@app/core/store/config';

declare var $: any;

@Component({
    selector: 'app-alert-view-modal',
    templateUrl: './alert-view-modal.component.html',
    styleUrls: ['./alert-view-modal.component.css']
})
export class AlertViewModalComponent implements OnInit, OnDestroy {

    @Input() alert: DriveAlert;
    @Input() reloadParent: Function;
    @Input() drivers: Driver[];
    videos: AlertVideo[];

    public coachingComment: string;
    public videoViewId: string = "";
    public driverSignature: any = null;
    public isCoachingVideoSuccess: boolean = false;

    constructor(
        private viewAlertModal: BsModalRef,
        private restService: RestService,
        private modalService: BsModalService,
        private actions$: Actions,
        private store: Store<ConfigState>,
        private lsService: LocalStorageService
    ) { }

    addMissedVideos(videos: AlertVideo[]) {
        let allPositions = [0, 1, 2, 3];
        let result: AlertVideo[] = [];
        allPositions.forEach(function (position) {
            let theVideo = videos.find(function (video) {
                return video.position === position;
            });
            if (!theVideo) {
                theVideo = plainToClass(AlertVideo,
                    {
                        "position": position,
                        "link": null
                    } as AlertVideo);
            }
            result.push(theVideo);
        });
        return result;
    }

    ngOnInit() {
        this.loggedInAs = this.lsService.getLoginAs();

        this.store.select(getConfigCompany).subscribe((company: Company) => {
            this.company = company;
        });
        this.loginAsCompany = this.lsService.getCompany();
      
        this.store.select(getUser).subscribe((user: any) => {
          this.user = plainToClass(User, user as User);
        });

        this.videos = this.addMissedVideos(this.alert.videos || []);
        this.reloadComments();

        // define namespace functions
        window.truckspy = window.truckspy || {};
        window.truckspy.onPlay = this.onPlay.bind(this);
        window.truckspy.onPause = this.onPause.bind(this);
        window.truckspy.onSeeked = this.onSeeked.bind(this);

        if (this.alert.driverSignature) {
            this.getDriverSignature(this.alert.id);
        }
    }

    comments: DriveAlertComment[] = [];
    reloadComments() {
        this.restService.get1000DriveAlertComments(this.alert.id)
            .subscribe(comments => {
                this.comments = comments;
            });
    }

    ngOnDestroy() {
        window.truckspy.onPlay = null;
        window.truckspy.onPause = null;
        window.truckspy.onSeeked = null;
    }

    @ViewChild('videoPlayer') videoPlayer: ElementRef;
    /**
     * Rearanges videos to make `#index` to be the primary one.
     */
    prioritizeVideo(index) {
        // const currentTime = this.videoPlayer.nativeElement.currentTime;

        let result = [...this.videos];
        let temp = result[index];
        result[index] = result[0];
        result[0] = temp;
        this.videos = [...result];

        // setTimeout(() => {
        //     this.videoPlayer.nativeElement.currentTime = currentTime;
        //     $('.alert-small-video-marker').each(function (index, element) {
        //         element.currentTime = currentTime;
        //     });
        // }, 2000);
    }

    onPause() {
        $('.alert-small-video-marker').each(function (index, element) {
            element.pause();
        });
    }
    onPlay() {
        $('.alert-small-video-marker').each(function (index, element) {
            element.play();
        });
    }
    onSeeked() {
        const currentTime = this.videoPlayer.nativeElement.currentTime;
        $('.alert-small-video-marker').each(function (index, element) {
            element.currentTime = currentTime;
        });
    }

    closeAlertViewModal(): void {
        this.viewAlertModal.hide();
    }

    markReviewed(event: any, alert: any) {
        let observable = this.restService.markAlertReviewed(alert.id);
        this.callAlertAction(observable, event.srcElement);
    }
    markNotReviewed(event: any, alert: any) {
        let observable = this.restService.markAlertNotReviewed(alert.id);
        this.callAlertAction(observable, event.srcElement);
    }

    isCoachable(alert: DriveAlert) {
        return alert.status === DriveAlertStatus.COACHABLE;
    }
    isNotCoachable(alert: DriveAlert) {
        return alert.status === DriveAlertStatus.NON_COACHABLE;
    }
    isNotApplicable(alert: DriveAlert) {
        return alert.status === DriveAlertStatus.NOT_APPLICABLE;
    }

    markCoachable(event: any, alert: any) {
        let observable = this.restService.markAlertCoachable(alert.id);
        this.callAlertAction(observable, event.srcElement);
    }
    markNotCoachable(event: any, alert: any) {
        let observable = this.restService.markAlertNotCoachable(alert.id);
        this.callAlertAction(observable, event.srcElement);
    }
    markNotApplicable(event: any, alert: any) {
        let observable = this.restService.markAlertNotApplicable(alert.id);
        this.callAlertAction(observable, event.srcElement);
    }

    callAlertAction(observable: Observable<any>, element: any) {
        var waitElement = document.createElement('span');
        waitElement.innerHTML = 'wait...';
        element.parentNode.replaceChild(waitElement, element);

        observable.subscribe(
            updated => {
                this.alert = updated;
                this.reloadParent();
                waitElement.parentNode.replaceChild(element, waitElement);
            },
            error => {
                waitElement.parentNode.replaceChild(element, waitElement);
            }
        );
    }

    /**
     * Assign Driver modal reference to operate with within component.
     * @type {BsModalRef}
     */
    _assignModal: BsModalRef;
    assignData = {
        driverId: ""
    };
    onDriverChanged(driverId: string) {
        this.assignData.driverId = driverId;
    }

    assign(template: TemplateRef<any>) {
        this.assignData = {
            driverId: this.alert.driver
                ? this.alert.driver.id
                : (this.drivers && this.drivers.length > 0 && this.drivers[0].id || "")
        };
        this._assignModal = this.modalService.show(template, { class: "modal-400" });
    }

    doAssign() {
        this.restService.assignAlertDriver(this.alert.id, this.assignData.driverId)
            .subscribe(
                updated => {
                    this.alert = updated;
                    this._assignModal.hide();
                    this.reloadParent();
                });
    }
    closeAssignModal(): void {
        this._assignModal.hide();
    }

    convertToCoachingSession() {
        if (this.checkConvertingForm()) {
            this.restService.makeTraining(this.alert.id, {
                coachingText: this.coachingComment,
                coachingVideo: {
                    id: this.videoViewId
                }
            }).subscribe(() => {
                this.isCoachingVideoSuccess = true;
            });
        }
    }

    checkConvertingForm() {
        return this.coachingComment && this.videoViewId;
    }

    getDriverSignature(driveAlertId: string) {
        return this.restService.getDriverSignature(driveAlertId).subscribe(img => {
            const reader = new FileReader();
            reader.readAsDataURL(img);
            reader.onloadend = () => {
                this.driverSignature = reader.result;
            }
        })
    }

    downloadPDF() {
        this.restService.downloadCoachingSessionPdf(this.alert.id);
    }

    /**
     * Add comment logic
     */
    public theComment: string;

    addComment() {
        if (!!this.theComment) {
            this.restService.createDriveAlertComment(this.alert.id, this.theComment)
                .subscribe(newComment => {
                    this.theComment = "";
                    this.reloadComments();
                });
        }
    }

    /**
     * Edit and delete comment logics
     */
    beginEdit(comment: DriveAlertComment) {
        comment.commentEdit = comment.comment;
        comment.edit = true;
    }
    cancelEdit(comment: DriveAlertComment) {
        comment.edit = false;
    }
    saveComment(comment: DriveAlertComment) {
        if (!!comment.commentEdit) {
            this.restService.updateDriveAlertComment(this.alert.id, comment.id, comment.commentEdit)
                .subscribe(updatedComment => {
                    this.reloadComments();
                });
        }
    }

    beginDelete(comment: DriveAlertComment) {
        comment.delete = true;
    }
    cancelDelete(comment: DriveAlertComment) {
        comment.delete = false;
    }
    deleteComment(comment: DriveAlertComment) {
        this.restService.deleteDriveAlertComment(this.alert.id, comment.id)
            .subscribe(success => {
                this.reloadComments();
            });
    }

    /**
     * LoginAs logic handling.
     */
    user: User;
    loggedInAs: User;
    theUser() {
        return !!this.loggedInAs ? this.loggedInAs : this.user;
    }

    company: Company;
    loginAsCompany: Company;
    theCompany() {
        return !!this.loginAsCompany ? this.loginAsCompany : this.company;
    }

    onLoggedInAs = this.actions$.subscribe(action => {
        if (action instanceof LoggedInAs) {
            this.loggedInAs = this.lsService.getLoginAs();
            this.loginAsCompany = this.lsService.getCompany();
        }
    });
    onLoggedOutAs = this.actions$.subscribe(action => {
        if (action instanceof LoggedOutAs) {
            this.loggedInAs = null;
            this.loginAsCompany = null;
        }
    });

}
