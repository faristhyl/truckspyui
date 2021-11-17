import {Subscription} from "rxjs";
import { Component, OnInit, OnDestroy, ElementRef, AfterViewInit, AfterContentInit, Renderer2 } from '@angular/core';
import { Router} from "@angular/router";
import { plainToClass } from "class-transformer";

import { trigger, state, style, transition, animate} from '@angular/animations'
import { Actions } from "@ngrx/effects";
import { Store, select } from "@ngrx/store";
import { take } from "rxjs/operators";

import { LayoutService, LogoutService, LocalStorageService, User, Company } from "@app/core/services";
import { ProfileState, getProfileModel } from "@app/core/store/profile";
import { LoggedInAs, LoggedOutAs, getUser } from "@app/core/store/auth";
import { getConfigCompany } from '@app/core/store/config';
import { createProfile } from "@app/core/store/profile/profile.model";

@Component({
  selector: 'sa-shortcut',
  templateUrl: './shortcut.component.html',
  animations: [
    trigger('shortcutState', [
      state('out', style({
        height: 0,
      })),
      state('in', style({
        height: '*',
      })),
      transition('out => in', animate('250ms ease-out')),
      transition('in => out', animate('250ms 300ms ease-out'))
    ])
  ]
})
export class ShortcutComponent implements OnInit, AfterViewInit, AfterContentInit, OnDestroy {

  public state:string = 'out';

  private layoutSub:Subscription;
  private documentSub:any;

  private loggedInAsProfile;
  private userProfile;
  theUserProfile() {
    return !!this.loggedInAsProfile ? this.loggedInAsProfile : this.userProfile;
  }

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
      this.loggedInAsProfile = createProfile(this.lsService.getLoginAs());
    }
  });
  onLoggedOutAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedOutAs) {
      this.loggedInAs = null;
      this.loginAsCompany = null;
      this.loggedInAsProfile = null;
    }
  });

  constructor(
    private actions$: Actions,
    private layoutService: LayoutService,
    private logoutService: LogoutService,
    private store: Store<ProfileState>,
    private router: Router,
    private renderer: Renderer2,
    private el: ElementRef,
    private lsService: LocalStorageService) { }

  shortcutTo(route) {
    this.router.navigate(route);
    this.layoutService.onShortcutToggle(false);
  }

  showLogoutPopup() {
    this.logoutService.showPopup(this.theUserProfile().name);
  }

  ngOnInit() {
    // Need to take logged-in-as user if specified
    this.loggedInAs = this.lsService.getLoginAs();
    this.loggedInAsProfile = !!this.loggedInAs ? createProfile(this.loggedInAs) : null;
    this.store.pipe(select(getProfileModel), take(1)).subscribe(val => this.userProfile = val);
    this.store.select(getUser).subscribe((user: any) => {
      this.user = plainToClass(User, user as User);
    });

    this.loginAsCompany = this.lsService.getCompany();
    this.store.select(getConfigCompany).subscribe((company: Company) => {
      this.company = company;
    });
  }

  listen() {
    this.layoutSub = this.layoutService.subscribe((store)=> {
      this.state = store.shortcutOpen ? 'in' : 'out'

      if (store.shortcutOpen) {
        this.documentSub = this.renderer.listen('document', 'mouseup', (event) => {
          if (!this.el.nativeElement.contains(event.target)) {
            this.layoutService.onShortcutToggle(false);
            this.documentUnsub()
          }
        });
      } else {
        this.documentUnsub()
      }
    })
  }

  ngAfterContentInit() {
    this.listen()
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.layoutSub.unsubscribe();
  }

  documentUnsub() {
    this.documentSub && this.documentSub();
    this.documentSub = null
  }

}
