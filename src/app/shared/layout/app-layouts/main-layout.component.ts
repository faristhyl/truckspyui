import { Component, OnInit } from "@angular/core";
import { Actions } from "@ngrx/effects";
import { Store } from '@ngrx/store';
import { plainToClass } from "class-transformer";

import { routerTransition } from "@app/shared/utils/animations";
import { Company, LocalStorageService, User } from '@app/core/services/rest.service';
import { getConfigCompany } from '@app/core/store/config';
import { LoggedInAs, getUser, LoggedOutAs } from '@app/core/store/auth';

@Component({
  selector: "app-main-layout",
  templateUrl: "./main-layout.component.html",
  styles: [],
  animations: [routerTransition]
})
export class MainLayoutComponent implements OnInit {

  company: Company;
  loginAsCompany: Company;
  theCompany() {
    return !!this.loginAsCompany ? this.loginAsCompany : this.company;
  }

  user: User;
  loggedInAs: User;
  theUser() {
    return !!this.loggedInAs ? this.loggedInAs : this.user;
  }

  constructor(
    private store: Store<any>,
    private actions$: Actions,
    private lsService: LocalStorageService) { }

  ngOnInit() {
    this.loggedInAs = this.lsService.getLoginAs();
    this.store.select(getUser).subscribe((user: any) => {
      this.user = plainToClass(User, user as User);
    });
    this.store.select(getConfigCompany).subscribe((company: Company) => {
      this.company = company;
    });
    this.loginAsCompany = this.lsService.getCompany();
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

  getState(outlet) {
    if (!outlet.activatedRoute) return;
    let ss = outlet.activatedRoute.snapshot;

    // return unique string that is used as state identifier in router animation
    return (
      outlet.activatedRouteData.state ||
      (ss.url.length
        ? ss.url[0].path
        : ss.parent.url.length
          ? ss.parent.url[0].path
          : null)
    );
  }

}
