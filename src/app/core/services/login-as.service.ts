import { Injectable } from '@angular/core';
import { Router } from "@angular/router";
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';

import { AuthState, LoggedInAs } from '@app/core/store/auth';
import { TIMEZONE_DEFAULT } from '@app/core/smartadmin.config';
import { Company, Connection, LocalStorageService, RestService, User } from './rest.service';

@Injectable()
export class LoginAsService {

  constructor(
    private router: Router,
    private restService: RestService,
    private store: Store<AuthState>,
    private lsService: LocalStorageService
  ) { }

  loginAsUser(companyId: string, user: User) {
    this.loginAsUser2URI(companyId, user, null);
  }

  loginAsUser2URI(companyId: string, user: User, uri: string) {
    combineLatest(
      this.restService.getCompanyBy(companyId),
      this.restService.getAdminVisTracksConnection(companyId)
    ).subscribe(data => {
      const company = data[0];
      const visTracks = data[1];
      this.loginAs(company, user, uri, visTracks);
    });
  }

  loginAsFirstOwner(companyId: string) {
    this.loginAsFirstOwner2URI(companyId, null);
  }

  loginAsFirstOwner2URI(companyId: string, uri: string) {
    combineLatest(
      this.restService.getCompanyBy(companyId),
      this.restService.getAdminVisTracksConnection(companyId)
    ).subscribe(data => {
      const company = data[0];
      const visTracks = data[1];
      this.loginAs(company, null, uri, visTracks);
    });
  }

  savePreferences(loginAs: any, company: any) {
    this.lsService.storeLoginAsInfo(loginAs, company);
    this.store.dispatch(new LoggedInAs());
  }

  loginAsThirdParty(user: User) {
    this.loginAs(new Company(), user, null, null);
  }

  private loginAs(company: Company, user: User = null, uri: string = null, visTracks: Connection) {
    let theUser = user;
    if (!theUser) {
      theUser = (company && company.getFirstOwner()) || null;
    }

    if (company && theUser) {
      this.lsService.storeLoginAsInfo(theUser, company);
      this.lsService.storeLoginAsVisApiKey(visTracks ? visTracks.auth : null);

      const timezone = (theUser && theUser.timezone) || TIMEZONE_DEFAULT;
      this.restService.getConfigLocalTime(timezone).subscribe(
        localtime => {
          this.lsService.storeLoginAsLocaltime(localtime);
          this.store.dispatch(new LoggedInAs());
          this.router.navigateByUrl('/empty', { skipLocationChange: true })
            .then(() => {
              let theURI = !!uri ? uri : theUser.getEntryPoint();
              this.router.navigate([theURI]);
            });
        }
      );
    }
  }

}
