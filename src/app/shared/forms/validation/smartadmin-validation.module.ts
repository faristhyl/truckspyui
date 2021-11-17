import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {UiValidateDirective} from "./ui-validate.directive";
import {BootstrapValidatorDirective} from "./bootstrap-validator.directive";
import { MustMatchDirective } from './must-match.directive';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    UiValidateDirective,
    BootstrapValidatorDirective,
    MustMatchDirective
  ],
  exports: [
    UiValidateDirective,
    BootstrapValidatorDirective,
    MustMatchDirective
  ]
})
export class SmartadminValidationModule { }
