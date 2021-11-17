import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { plainToClass } from 'class-transformer';

import * as fromAuth from '../store/auth';
import { User, LocalStorageService, AuthService } from '../services';

// Paths common for all users (admins and regular ones)
const COMMON_PATHS = ["empty", "preferences"];

const ADMIN_DEFAULT_PATH = "admin";
const THIRD_PARTY_DEFAULT_PATH = "third-party"; 
const LOGIN_URI = "/auth/login";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private store: Store<fromAuth.AuthState>,
    private lsService: LocalStorageService,
    private authService: AuthService) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {

    // save url for redirect if user isn't logged in
    this.authService.redirectUrl = this.getAngularUri(window.location.href);

    return this.store.pipe(
      select(fromAuth.getUser),
      map(userData => {
        if (!userData) {
          this.store.dispatch(new fromAuth.LoginRedirect('/auth/login'));
          return false;
        }

        let routePath = route.routeConfig.path;
        if (!COMMON_PATHS.includes(routePath)) {
          let currentUser: User = plainToClass(User, userData as User);
          let loginAs = this.lsService.getLoginAs();
          let theUser = !!loginAs ? loginAs : currentUser;

          if (theUser.isAdmin() && routePath !== ADMIN_DEFAULT_PATH) {
            this.store.dispatch(new fromAuth.LoginRedirect("/admin"));
            return false;
          }

          if (theUser.isThirdParty() && routePath !== THIRD_PARTY_DEFAULT_PATH) {
            this.store.dispatch(new fromAuth.LoginRedirect("/third-party"));
            return false;
          }

          if (theUser.isUser() && (routePath === ADMIN_DEFAULT_PATH || routePath === THIRD_PARTY_DEFAULT_PATH)) {
            this.store.dispatch(new fromAuth.LoginRedirect("/dashboard"));
            return false;
          }
        }

        return true;
      }),
      take(1)
    );
  }

  getAngularUri(url: string): string {
    const after = '/#';
    const afterBegin = url.indexOf(after);
    let thePart = url.slice(afterBegin).slice(after.length);
    return LOGIN_URI == thePart ? null : thePart;
  }
}
