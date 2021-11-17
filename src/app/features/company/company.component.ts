import { Component, OnInit } from '@angular/core';
import { StripeScriptTag } from "stripe-angular"
import { Actions } from "@ngrx/effects";
import { Store } from '@ngrx/store';

import { environment } from '@env/environment';
import { LoggedInAs, AuthState, LoggedOutAs } from '@app/core/store/auth';
import { getConfigCompany } from '@app/core/store/config';
import { LocalStorageService, Company } from '@app/core/services';

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css']
})
export class CompanyComponent implements OnInit {

  private publishableKey: string = environment.stripePublishableKey;

  constructor(
    public StripeScriptTag: StripeScriptTag,
    private actions$: Actions,
    private store: Store<AuthState>,
    private lsService: LocalStorageService) {
    this.StripeScriptTag.setPublishableKey(this.publishableKey);
  }

  ngOnInit() {
    this.store.select(getConfigCompany).subscribe((company: Company) => {
      this.company = company;
    });
    this.loginAsCompany = this.lsService.getCompany();
  }

  company: Company;
  loginAsCompany: Company;
  theCompany() {
    return !!this.loginAsCompany ? this.loginAsCompany : this.company;
  }

  onLoggedInAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedInAs) {
      this.loginAsCompany = this.lsService.getCompany();
    }
  });
  onLoggedOutAs = this.actions$.subscribe(action => {
    if (action instanceof LoggedOutAs) {
      this.loginAsCompany = null;
    }
  });

}
