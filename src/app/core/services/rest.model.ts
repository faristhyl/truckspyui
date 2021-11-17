import { Exclude, Type } from "class-transformer";
import * as moment from 'moment';
import _minBy from 'lodash/minBy';
import _maxBy from 'lodash/maxBy';

import { TABLE_LENGTH_ATTRIBUTE, TABLE_LENGTH_DEFAULT, ENTRY_POINT_ATTRIBUTE, ENTRY_POINT_DEFAULT, ENTRY_POINT_ADMIN_DEFAULT, ENTRY_POINT_THIRD_PARTY_DEFAULT } from "@app/core/smartadmin.config";

export class DateUtil {

    public static compareDate(date1: Date, date2: Date): number {
        // With Date object we can compare dates using the >, <, <= or >=.
        // The ==, !=, ===, and !== operators require to use date.getTime(),
        // so we need to create a new instance of Date with 'new Date()'
        let d1 = new Date(date1);
        let d2 = new Date(date2);

        let same = d1.getTime() === d2.getTime();
        if (same) return 0;
        if (d1 > d2) return 1;
        if (d1 < d2) return -1;
    }

    public static compareStringDate(date1: string, date2: string): number {
        let d1 = moment.utc(date1).toDate();
        let d2 = moment.utc(date2).toDate();
        return this.compareDate(d1, d2);
    }

    public static setEOD(date: Date): void {
        date.setHours(23);
        date.setMinutes(59);
        date.setSeconds(59);
    }

}

export enum StopType {
    PICKUP = 'PICKUP',
    DROP = 'DROP',
    POSITION = 'POSITION', // should be filtered out on the UI
    DROP_DOCK = 'DROP DOCK',
    PICKUP_DOCK = 'PICKUP DOCK',
    TRAILER_POSITION = 'TRAILER POSITION',
    TRACTOR_POSITION = 'TRACTOR POSITION'
}

export enum StopLoadType {
    EMPTY = "EMPTY",
    LOADED = "LOADED"
}

export enum BookingStatus {
    AVAILABLE = "Available",
    DISPATCHED = "Dispatched",
    COMPLETED = "Completed",
    ALL = "All",
}

export enum ResourceType {
    VEHICLE = "Vehicle",
    DRIVER = "Driver"
}

export enum TripStatus {
    PREASSIGNED = "PREASSIGNED", // Plan
    DISPATCHED = "DISPATCHED", // Plan
    ON_HOLD = "ON HOLD", // Current
    APPROVED = "APPROVED", // Current
    COMPLETE = "COMPLETE", // Complete
}

export enum ChangeLogInitiatorType {
    CONNECTION = "Connection",
    DRIVER = "Driver",
    WEB_USER = "Web User"
}

export enum ChangeLogType {
    CREATED = "Created",
    STATUS_CHANGED = "StatusChanged"
}

export enum Status {
    ACTIVE = "(active)",
    DELETED = "(deleted)",
}

export enum DeviceStatus {
    ACTIVE = "active",
    DEACTIVATED = 'deactivated'
}

export enum RoleType {
    ADMIN = "ROLE_SUPER_ADMIN",
    REGULAR_ADMIN = "ROLE_ADMIN",
    ALLOWED_TO_SWITCH = "ROLE_ALLOWED_TO_SWITCH",
    OWNER = "ROLE_OWNER",
    USER = "ROLE_USER",
    EMPLOYEE = "ROLE_EMPLOYEE",
    THIRD_PARTY = "ROLE_THIRD_PARTY"
}
export class StatusInBoolean {
    ACTIVE: boolean = true;
    DEACTIVE: boolean = false;
}
export enum DiscountType {
    FLAT = "FLAT",
    VARIABLE = "VARIABLE"
}

export enum EntityType {
    DRIVER = "Driver",
    DEVICE = "Device",
    VEHICLE = "Vehicle",
    REPORTING_PROFILE = "ReportingProfile",
    CONNECTION = "Connection",
    COMPANY = "Company",
    LOCATION = "Location",
}

export enum DeviceAction {
    // WIPE_DEVICE = "Wipe Device",
    ENABLE_LOST_MODE = "Enable Lost Mode",
    DISABLE_LOST_MODE = "Disable Lost Mode",
    POWER_OFF = "Power Off",
    RESTART = "Restart"
}

export class EntityTypeUtil {
    public static getFAIcon(type: EntityType) {
        switch (type) {
            case EntityType.DRIVER:
                return "fa-user";
            case EntityType.DEVICE:
                return "fa-tablet";
            case EntityType.VEHICLE:
                return "fa-truck";
            case EntityType.REPORTING_PROFILE:
                return "fa-files-o";
            case EntityType.CONNECTION:
                return "fa-link";
            default:
                return "fa-exclamation";
        }
    }

    public static getEntityType(entityType: string): EntityType {
        if (!entityType) {
            return null;
        }
        if (entityType.includes("Driver")) {
            return EntityType.DRIVER;
        }
        if (entityType.includes("Device")) {
            return EntityType.DEVICE;
        }
        if (entityType.includes("Vehicle")) {
            return EntityType.VEHICLE;
        }
        if (entityType.includes("ReportingProfile")) {
            return EntityType.REPORTING_PROFILE;
        }
        if (entityType.includes("Connection")) {
            return EntityType.CONNECTION;
        }
        if (entityType.includes("Company")) {
            return EntityType.COMPANY;
        }
    }

    public static getURI(entityType: string, entityId: string): string {
        if (!entityType || !entityId) {
            return null;
        }
        switch (entityType) {
            case EntityType.DRIVER:
                return `#/drivers/${entityId}/view`;
            case EntityType.DEVICE:
                return `#/devices/${entityId}/view`;
            case EntityType.VEHICLE:
                return `#/vehicles/${entityId}/view`;
            case EntityType.REPORTING_PROFILE:
                return `#/reporting/${entityId}/view`;
            case EntityType.CONNECTION:
                return `#/company/connections/${entityId}/view`;
            default:
                return null;
        }
    }

    public static getEventsAPI(entityType: string, entityId: string): string {
        return this.generateEventsAPI(entityType, entityId);
    }

    public static getAdminEventsAPI(entityType: string, entityId: string): string {
        return this.generateEventsAPI(entityType, entityId, "api/web/admin");
    }

    private static generateEventsAPI(entityType: string, entityId: string, baseURI: string = "api/web"): string {
        if (!entityType || !entityId) {
            return null;
        }
        switch (entityType) {
            case EntityType.DRIVER:
                return `${baseURI}/drivers/${entityId}/events`;
            case EntityType.DEVICE:
                return `${baseURI}/devices/${entityId}/events`;
            case EntityType.VEHICLE:
                return `${baseURI}/vehicles/${entityId}/events`;
            default:
                return null;
        }
    }
}

export class ReportTypeUtil {
    public static getReportNames(types: ReportType[]) {
        if (!types || types.length === 0) {
            return [];
        }
        let result: string[] = [];
        types.forEach(type => {
            result.push(...type.reportNames);
        });
        return result;
    }
}

export class Dictionary {
    [key: string]: string;
}

export abstract class Reportable {
    id: string;
    availableReports: any;

    constructor() { }

    getProductTypes(): string[] {
        if (!this.availableReports) {
            return [];
        }
        return Object.keys(this.availableReports);
    }

    getReportNames(productType: string): string[] {
        if (!this.availableReports) {
            return [];
        }
        return this.availableReports[productType] || [];
    }
}

export class Product {
    readonly type: string;
    readonly description: string;
    readonly availableReports: string[];

    constructor() { }
}

export class ProductEstimation {
    readonly type: string;
    readonly reportingProfileId: string;
    readonly estimatedQuantity: number;
    readonly estimatedAmount: number;
    readonly billingUnit: string;

    constructor() { }

    estimatedTotalAmount() {
        if (!this.estimatedQuantity || !this.estimatedAmount) {
            return 0;
        }
        return this.estimatedQuantity * this.estimatedAmount;
    }
}

export class Attribute {
    readonly name: string;
    readonly value: string;

    constructor();

    constructor(name: string, value: string);

    constructor(name?: string, value?: string) {
        this.name = name || null;
        this.value = value || null;
    }
}

export class User {
    readonly id;
    readonly username: string;
    readonly email: string;
    readonly phone: string;
    readonly enabled: boolean;
    readonly lastLogin: string;
    readonly roles: string[];
    readonly timezone: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly grantedLocationsIds: string[];
    searchAgainst: string; // for ng-select bindLabel only
    @Type(() => Attribute)
    readonly attributes: Attribute[];
    @Type(() => Company)
    readonly company: Company;

    constructor() { }

    getAttribute(name: string): string {
        if (!!this.attributes && this.attributes.length > 0) {
            let attribute = this.attributes.find(function (next) {
                return next.name === name;
            });
            if (!!attribute) {
                return attribute.value;
            }
        }
        return null;
    }

    getDefaultEntryPoint(): string {
        if (this.isAdmin()) {
            return ENTRY_POINT_ADMIN_DEFAULT;
        }
        if (this.isThirdParty()) {
            return ENTRY_POINT_THIRD_PARTY_DEFAULT;
        }
        return ENTRY_POINT_DEFAULT;
    }

    getEntryPoint(): string {
        let entryPoint = this.getAttribute(ENTRY_POINT_ATTRIBUTE);
        return !!entryPoint ? entryPoint : this.getDefaultEntryPoint();
    }

    getTableLength(): number {
        let tableLength = this.getAttribute(TABLE_LENGTH_ATTRIBUTE);
        return !!tableLength ? +tableLength : TABLE_LENGTH_DEFAULT;
    }

    name(): string {
        if (this.firstName || this.lastName) {
            let first: string = this.firstName || "";
            let last: string = this.lastName || "";
            return (!!first || !!last) ? `${first} ${last}` : "(unspecified)";
        }
        return this.email;
    }

    isAdmin(): boolean {
        return this.roles && this.roles.includes(RoleType.ADMIN);
    }

    isOwner(): boolean {
        return this.roles && this.roles.includes(RoleType.OWNER);
    }

    isUser(): boolean {
        return this.roles && !this.roles.includes(RoleType.ADMIN) && !this.roles.includes(RoleType.THIRD_PARTY);
    }

    isThirdParty(): boolean {
        return this.roles && this.roles.includes(RoleType.THIRD_PARTY) && !this.roles.includes(RoleType.ADMIN);
    }

}

export class StatisticPoint {
    readonly datetime: string;
    readonly value: number;

    constructor() { }
}

export class StatisticSeries {
    readonly total: number;
    readonly name: string;
    @Type(() => StatisticPoint)
    readonly points: StatisticPoint[];
    readonly unit: string;

    constructor() { }
}

export class Statistics {
    readonly percentChange: number;
    readonly dataSetName: string;
    readonly reportPeriodType: string;
    @Type(() => StatisticSeries)
    readonly series: StatisticSeries[];

    constructor() { }

    getSeriesData(): any[] {
        let result = [];
        this.series.forEach(s => {
            let sData = s.points.map(function (p: StatisticPoint) {
                return [p.datetime, p.value];
            });
            result.push(sData);
        });
        return result;
    }

    getUnit() {
        return (this.series && this.series.length > 0 && this.series[0].unit) || "";
    }
    getTotals() {
        if (this.series && this.series.length === 2) {
            return `(${this.series[1].total.toFixed(1)} → ${this.series[0].total.toFixed(1)})`;
        }
        return "";
    }
}

export class AuthInfo {
    readonly apiKey: string;
    @Type(() => User)
    readonly user: User;

    constructor() { }
}

export class Invoice {
    readonly id: string;
    readonly invoiceNumber: string;
    readonly date: string;
    readonly periodEndedAt: string;
    readonly paid: boolean;
    readonly amount: number;
    readonly amountTotal: number;
    readonly discountAmount: number;
    readonly chargeFailedAttempts: number;

    @Type(() => Company)
    readonly company: Company;

    constructor() { }
}

export enum IssueSourceType {
    DRIVER_INSPECTION = 'Driver Inspection',
    ENGINE_FAULT = 'Engine Fault',
    SCHEDULED_MAINTENANCE = 'Scheduled Maintenance',
    USER_CREATED = 'User Created'
}

export enum IssueStatus {
    NEW = 'New',
    ASSIGNED = 'Assigned',
    ON_HOLD = 'On-hold',
    REPAIRED = 'Repaired',
    RESOLVED = 'Resolved',
    NOT_ACTIONABLE = 'Not-actionable'
}

export enum RepairOrderStatus {
    NEW = 'New',
    CLOSED = 'Closed'
}

export class WorkOrder {
    readonly id: string;
    readonly number: string;
    readonly status: string; // one of RepairOrderStatus
    readonly createdAt: string;

    @Type(() => MaintenanceIssue)
    readonly issues: MaintenanceIssue[];
    @Type(() => Vehicle)
    readonly vehicle: Vehicle;
    @Type(() => User)
    readonly assignedTo: User;

    getNumber() {
        return this.number || "(unspecified)";
    }

    notClosed() {
        return this.status !== RepairOrderStatus.CLOSED;
    }

    isAssignableTo() {
        return this.status === RepairOrderStatus.NEW;
    }

    constructor() { }
}

export class IssueSource {
    readonly type: string; // one of IssueSourceType
    readonly id: string;

    constructor() { }
}

export class MaintenanceIssue {
    readonly id: string;
    readonly status: string; // one of IssueStatus
    @Type(() => IssueSource)
    readonly source: IssueSource;
    @Type(() => Vehicle)
    readonly vehicle: Vehicle;
    readonly number: string;
    readonly description: string;
    @Type(() => WorkOrder)
    readonly repairOrder: WorkOrder;
    readonly createdAt: string;
    readonly comments: string;

    readonly approvedAt: string;
    @Type(() => Driver)
    readonly approvedBy: Driver;

    @Type(() => DomicileLocation)
    readonly location: DomicileLocation;

    constructor() { }

    isResolved() {
        return this.status === IssueStatus.RESOLVED;
    }

    isAssignable() {
        return this.status === IssueStatus.NEW || this.status === IssueStatus.ASSIGNED;
    }
}

export class MaintenanceStatisctics {
    readonly unAssignedIssues: number;
    readonly assignedIssues: number;
    readonly resolvedThisWeekIssues: number;
    readonly resolvedLastWeekIssues: number;

    constructor() { }
}

export class Mask {
    readonly formatted: string;
}

export enum FaultRuleAction {
    CREATE_ISSUE = "Create Issue"
}

export class SPNDescription {
    readonly spn: number;
    readonly label: string;

    constructor() { }
}

export class FaultRule {
    readonly id: string;
    readonly createdAt: string;
    readonly action: string; // one of FaultRuleAction
    readonly description: string;
    @Type(() => Mask)
    readonly mask: Mask;

    constructor() { }
}

export enum Measure {
    DAYS = 'Days',
    ENGINE_HOURS = 'Engine Hours',
    MILES = 'Miles'
}

export enum MaintenanceItemType {
    PERIODIC_BASED = 'PeriodicBased',
    ENGINE_HOURS_BASED = 'EngineHoursBased',
    MILEAGE_BASED = 'MileageBased'
}

export enum DriveAlertStatus {
    COACHABLE = "Coachable",
    NON_COACHABLE = "Non-Coachable",
    NOT_APPLICABLE = "Not-Applicable"
}

export class MaintenanceGroup {
    readonly id: string;
    readonly createdAt: string;
    readonly name: string;
    @Type(() => Vehicle)
    readonly vehicles: Vehicle[];
    @Type(() => MaintenanceItem)
    readonly items: MaintenanceItem[];

    constructor() { }
}

export class MaintenanceItem {
    readonly id: string;
    readonly createdAt: string;
    readonly type: string; // one of MaintenanceItemType
    readonly numberOf: number;
    readonly name: string;
    readonly measure: string; // one of Measure
    @Type(() => MaintenanceGroup)
    readonly group: MaintenanceGroup;

    constructor() { }
}

export class MaintenanceItemProgress {
    readonly id: string;
    readonly createdAt: string;
    readonly currentValueOf: number;
    readonly initialValue: number;
    readonly initialValueDateTime: string;
    readonly lastUpdate: string;
    @Type(() => MaintenanceItem)
    readonly scheduledMaintenanceItem: MaintenanceItem;
    @Type(() => MaintenanceIssue)
    readonly issue: MaintenanceIssue;

    constructor() { }

    theType() {
        return this.scheduledMaintenanceItem && this.scheduledMaintenanceItem.type;
    }

    theMeasure(type: string): string {
        switch (type) {
            case MaintenanceItemType.ENGINE_HOURS_BASED:
                return "hours";
            case MaintenanceItemType.PERIODIC_BASED:
                return "days";
            case MaintenanceItemType.MILEAGE_BASED:
                return "miles";
            default:
                return "";
        }
    }

    theInterval() {
        return this.scheduledMaintenanceItem && this.scheduledMaintenanceItem.numberOf || 0;
    }

    name() {
        return this.scheduledMaintenanceItem && this.scheduledMaintenanceItem.name || "unspecified";
    }

    frequency() {
        let type = this.theType();
        if (!type) {
            return "";
        }
        return `${this.theInterval()} ${this.theMeasure(type)}`;
    }

    remaining() {
        let type = this.theType();
        if (!type) {
            return "";
        }

        let interval = this.theInterval();
        if (type == MaintenanceItemType.PERIODIC_BASED) {
            return interval - this.currentValueOf;
        }
        return interval + this.initialValue - this.currentValueOf;
    }
}

export class AlertVideo {
    readonly id: string;
    readonly netradyneId: string;
    readonly datetime: string;
    readonly status: number; // one of 1, 2, 3
    readonly position: number; // one of 1, 2, 3
    readonly link: string | null; // Video URL
    readonly createdAt: string;
}

export enum DriveAlertType {
    CAMERA_OBSTRUCTION = 'CAMERA-OBSTRUCTION',
    DRIVER_DISTRACTION = 'DRIVER-DISTRACTION',
    DRIVER_DROWSINESS = 'DRIVER-DROWSINESS',
    DRIVER_INITIATED = 'DRIVER-INITIATED',
    HARD_ACCELERATION = 'HARD-ACCELERATION',
    HARD_BRAKING = 'HARD-BRAKING',
    HARD_TURN = 'HARD-TURN',
    HIGH_G = 'HIGH-G',
    SEATBELT_COMPLIANCE = 'SEATBELT-COMPLIANCE',
    SIGN_VIOLATIONS = 'SIGN-VIOLATIONS',
    SPEEDING_VIOLATIONS = 'SPEEDING-VIOLATIONS',
    TRAFFIC_LIGHT_VIOLATION = 'TRAFFIC-LIGHT-VIOLATION',
    U_TURN = 'U-TURN'
}

export class DriveAlert {
    readonly id: string;
    readonly remoteId: string;
    readonly createdAt: string;

    @Type(() => Vehicle)
    readonly vehicle: Vehicle;
    @Type(() => Driver)
    readonly driver: Driver;

    readonly netradyneId: string;
    readonly datetime: string;
    readonly type: number;
    readonly typeDesc: string; // one of DriveAlertType
    readonly subType: number;
    readonly subTypeDesc: string;
    readonly severity: number;
    readonly severityDesc: string;
    readonly category: number;
    readonly categoryDesc: string;
    readonly alertVideoStatus: number;
    readonly cause: number;
    readonly speed: number;
    readonly speedLimit: number;

    @Type(() => Point)
    readonly point: Point;
    readonly textualLocation: string;

    @Type(() => AlertVideo)
    readonly videos: AlertVideo[];
    @Type(() => ConnectionBind)
    readonly connectionBindList: ConnectionBind[];

    readonly reviewed: boolean;
    readonly reviewedAt: string;
    @Type(() => User)
    readonly reviewedBy: User;
    readonly coachable: boolean;
    readonly coachingCompletedAt: string;
    readonly coachingText: string | null;
    readonly coachingVideo: AlertVideo;
    readonly sentToDriver: boolean;
    readonly driverSignature: string;
    readonly status: DriveAlertStatus;

    constructor() { }

    speedDescription() {
        if (this.typeDesc === DriveAlertType.SPEEDING_VIOLATIONS) {
            let speed = Math.round(this.speed);
            let limit = this.speedLimit || "unknown";
            return ` (${speed} in ${limit})`;
        }
        return "";
    }

    isSentToDriver() {
        return !!this.sentToDriver ? "Yes" : "No";
    }

}

export class DriveAlertComment {
    readonly id: string;
    readonly edited: boolean;
    readonly comment: string;
    readonly createdAt: string;
    @Type(() => User)
    readonly createdByUser: User;
    edit: boolean;
    delete: boolean;
    commentEdit: string;

    constructor() { }
}

export class DriverScoreContext {
    @Type(() => DriveAlert)
    readonly driveAlert: DriveAlert;
    readonly impact: number;

    constructor() { }
}

export class ScoreReport {
    readonly positiveEventCount: number;
    readonly negativeEventCount: number;
    readonly score: number;
    @Type(() => ReportPeriod)
    readonly reportPeriod: ReportPeriod;
    readonly drivingMinutes: number;
    readonly drivingMiles: number;
    // @Type(() => EventHistogram)
    // readonly histogram: EventHistogram;
    readonly isNinetiethPercentile: boolean;
    readonly isFiftienthPercentile: boolean;
    readonly isTenthPercentile: boolean;
    @Type(() => DriverScoreContext)
    readonly driverScoreContexts: DriverScoreContext[];

    constructor() { }
}

export class DashboardRow {
    @Type(() => Driver)
    readonly driver: Driver;
    @Type(() => ScoreReport)
    scoreReports: ScoreReport[]; // 3 elements

    constructor() { }
}

export class SafetyDashboardRequest {
    @Type(() => ReportingProfile)
    readonly reportingProfile: ReportingProfile;
    @Type(() => DispatchGroup)
    readonly dispatchGroup: DispatchGroup;

    constructor() { }
}

export class SafetyDashboard {
    @Type(() => DashboardRow)
    readonly rows: DashboardRow[];
    @Type(() => ReportPeriod)
    reportPeriods: ReportPeriod[];
    @Type(() => SafetyDashboardRequest)
    readonly request: SafetyDashboardRequest;

    constructor() { }

    private nullIfMissed(row: DashboardRow, index: number): ScoreReport {
        if (!row || !row.scoreReports || row.scoreReports.length === 0) {
            return null;
        }
        let scoreReport: ScoreReport = row.scoreReports.find(function (next) {
            return next.reportPeriod.startedAt === this.reportPeriods[index].startedAt;
            // return next.reportPeriod.startedAt === this.reportPeriods[index].startedAt &&
            //     next.reportPeriod.endedAt === this.reportPeriods[index].endedAt;
        }.bind(this));
        return scoreReport;
    }

    fillGaps() {
        if (!this.reportPeriods || this.reportPeriods.length === 0) {
            return;
        }

        // Let's order `reportPeriods` first in ASC way
        this.reportPeriods = this.reportPeriods
            .sort((a, b) => {
                let aValue = moment(a.startedAt);
                let bValue = moment(b.startedAt);
                return aValue.isBefore(bValue) ? -1 : (bValue.isBefore(aValue) ? 1 : 0);
            });

        this.rows.forEach((row: DashboardRow) => {
            if (!row.scoreReports) {
                row.scoreReports = [null, null, null];
            }
            row.scoreReports = [this.nullIfMissed(row, 0), this.nullIfMissed(row, 1), this.nullIfMissed(row, 2)];
        });
    }
}

export class HistogramRecord {
    @Type(() => ReportPeriod)
    readonly reportPeriod: ReportPeriod;
    readonly value: number;

    constructor() { }
}

export class HistogramRow {
    readonly type: string;
    @Type(() => HistogramRecord)
    readonly records: HistogramRecord[];

    constructor();

    constructor(type: string, records: HistogramRecord[]);

    constructor(type?: string, records?: HistogramRecord[]) {
        this.type = type || null;
        this.records = records || null;
    }
}

export class DriveAlertHistogram {
    @Type(() => ReportPeriod)
    reportPeriods: ReportPeriod[];
    @Type(() => HistogramRow)
    readonly rows: HistogramRow[];
    @Type(() => ScoreReport)
    readonly scores: ScoreReport[]; // 4 elements

    @Type(() => HistogramRow)
    displayableRows: HistogramRow[];
    @Type(() => ScoreReport)
    displayableReport: ScoreReport;

    constructor() { }

    private nullIfMissed(records: HistogramRecord[], index: number): HistogramRecord {
        if (!records || records.length === 0 || !this.reportPeriods || this.reportPeriods.length <= index) {
            return null;
        }
        let record: HistogramRecord = records.find(function (next) {
            return next.reportPeriod.startedAt === this.reportPeriods[index].startedAt;
            // return next.reportPeriod.startedAt === this.reportPeriods[index].startedAt &&
            //     next.reportPeriod.endedAt === this.reportPeriods[index].endedAt;
        }.bind(this));
        return record;
    }

    private fillDisplayableRows() {
        this.displayableRows = [];
        if (!this.reportPeriods || this.reportPeriods.length === 0) {
            return;
        }
        // Let's order `reportPeriods` first in ASC way
        this.reportPeriods = this.reportPeriods
            .sort((a, b) => {
                let aValue = moment(a.startedAt);
                let bValue = moment(b.startedAt);
                return aValue.isBefore(bValue) ? -1 : (bValue.isBefore(aValue) ? 1 : 0);
            });

        if (!this.rows || this.rows.length === 0) {
            return;
        }

        let types: string[] = this.rows.map((row: HistogramRow) => row.type);
        types = types.filter(function (x, i, a) {
            return a.indexOf(x) === i;
        });

        this.displayableRows = types.map(type => {
            let recordsList: HistogramRecord[][] = this.rows
                .filter(next => next.type === type)
                .map((row: HistogramRow) => row.records);
            let records: HistogramRecord[] = [].concat.apply([], recordsList);
            let displayableRecords = [
                this.nullIfMissed(records, 0), this.nullIfMissed(records, 1),
                this.nullIfMissed(records, 2), this.nullIfMissed(records, 3)];
            return new HistogramRow(type, displayableRecords);
        });
    }

    private fillDisplayableReport() {
        this.displayableReport = null;
        if (!this.reportPeriods || this.reportPeriods.length === 0) {
            return;
        }
        if (!this.scores || this.scores.length === 0) {
            return;
        }

        // Let's order `scores` in ASC way same to `reportPeriods` (done earlier in fillDisplayableRows())
        let scores: ScoreReport[] = this.reportPeriods.map(period => {
            let periodScore: ScoreReport = this.scores.find(function (score) {
                return !!score && !!score.reportPeriod && score.reportPeriod.startedAt === period.startedAt;
            });
            return periodScore;
        }).filter(score => !!score);
        this.displayableReport = scores && scores.length > 0 && scores[scores.length - 1] || null;
    }

    fillDisplayable() {
        this.fillDisplayableRows();
        this.fillDisplayableReport();
    }
}

export class DiscountContext {
    readonly applicable: boolean;
    readonly availableDiscountAmount: number;
    readonly discountPercent: number;
    readonly availableDiscountApplying: number;

    constructor() { }
}

export class Discount {
    readonly id: string;
    readonly name: string;
    readonly type: string; // DiscountType
    readonly createdAt: string;
    readonly applicable: boolean;

    @Type(() => DiscountContext)
    readonly context: DiscountContext;

    constructor() { }
}

export class Address {
    readonly line1: string;
    readonly line2: string;
    readonly city: string;
    readonly state: string;
    readonly country: string;
    readonly zip: string;

    constructor() { }

    getAddress() {
        let address: string = (this.line1 ? this.line1 + " " : "") +
            (this.line2 ? this.line2 + " " : "") +
            ((this.line1 || this.line2) ? " - " : "") +
            (this.city ? this.city + ", " : "") +
            (this.state ? this.state + " " : "") +
            (this.country ? this.country + " " : "") +
            (this.zip ? this.zip + "" : "");
        return address || "N/A";
    }
}

export class Customer {
    readonly id: string;
    readonly name: string;
    readonly phone: string;
    readonly status: string; // Active, Inactive
    readonly createdAt: string;

    @Type(() => Address)
    readonly billingAddress: Address;
    @Type(() => Address)
    readonly physicalAddress: Address;

    constructor() { }

    isActive() {
        return "Active" === this.status;
    }
}

export class CompanyFeatures {
    readonly fuel: boolean;
    readonly dispatching: boolean;
    readonly frontline: boolean;
    readonly devices: boolean;
    readonly maintenance: boolean;
    readonly hoursOfService: boolean;
    readonly groundBiz: boolean;
    readonly truckspyFuel: boolean;
    readonly driverCoaching: boolean;

    constructor() { }
}

export class Company extends Reportable {
    readonly name: string;
    readonly address1: string;
    readonly address2: string;
    readonly city: string;
    readonly state: string;
    readonly zip: string;
    readonly billedOn: number;
    readonly devicesEnabled: boolean;
    readonly creditAllowed: boolean;
    readonly mRR: number;
    readonly pricingScheme: string;
    readonly cameraOnly: boolean;

    @Type(() => ReportingProfile)
    readonly defaultReportingProfile: ReportingProfile;

    @Type(() => ReportingProfile)
    readonly reportingProfiles: ReportingProfile[];

    @Type(() => StripeCustomer)
    readonly stripeCustomer: StripeCustomer;

    @Type(() => User)
    readonly users: User[];

    @Type(() => Invoice)
    readonly lastInvoice: Invoice;

    @Type(() => CompanyFeatures)
    readonly enabledFeatures: CompanyFeatures;

    constructor() {
        super();
    }

    getFirstOwner(): User {
        if (!this.users || this.users.length === 0) {
            return null;
        }
        return this.users.find(function (next) {
            return next.isOwner() && next.enabled;
        });
    }

    getDefaultSource(): Source {
        if (!this.stripeCustomer || !this.stripeCustomer.sources ||
            !this.stripeCustomer.sources || this.stripeCustomer.sources.length == 0) {
            return null;
        }
        let defaultId = this.stripeCustomer.default_source;
        if (!defaultId) {
            return this.stripeCustomer.sources[0];
        }
        let result = this.stripeCustomer.sources.find(function (element) {
            return element.id === defaultId;
        });
        return result;
    }

    /**
     * Returns list of profiles with active subscriptions.
     *
     * @returns {ReportingProfile[]} result list of `ReportingProfile` instances
     */
    getProfilesWithActiveSubscription(): ReportingProfile[] {
        if (!this.reportingProfiles || this.reportingProfiles.length === 0) {
            return [];
        }
        return this.reportingProfiles.filter(
            profile => profile.hasActiveSubscription());
    }

    totalAmount(): number {
        if (!this.reportingProfiles || this.reportingProfiles.length === 0) {
            return 0;
        }
        let result = 0;
        this.reportingProfiles.forEach(function (reporting) {
            result += reporting.totalAmount();
        });
        return result;
    }
}

export class DispatchGroup {
    readonly id: string;
    readonly name: string;
    readonly createdAt: string;
    @Type(() => Company)
    readonly company: Company;

    constructor() { }
}

export class VehicleType {
    readonly id: string;
    readonly type: string;
    readonly description: string;
    readonly tareWeight: number;
    readonly volume: number;
    readonly capacity: number;
    readonly createdAt: string;
    @Type(() => Company)
    readonly company: Company;

    constructor() { }
}

export class Oauth2Client {
    readonly id: string;
    readonly allowedGrantTypes: string[];
    readonly clientId: string;
    readonly clientSecret: string;
    readonly randomId: string;
    readonly redirectUris: string[];
    @Type(() => Company)
    readonly company: Company;

    constructor() { }
}

export class FuelStatistics {
    readonly averagePrice: number;
    readonly averageEconomy: number;
    readonly averageCostPerMile: number;

    constructor() { }
}

export class TransactionLine {
    readonly id: string;
    readonly createdAt: string;
    readonly amount: number;
    readonly category: string;
    readonly ppu: number;
    readonly quantity: number;

    constructor() { }
}

export class FuelTransaction {
    readonly id: string;
    readonly transactionId: number;
    readonly vehicleRemoteId: string;

    readonly createdAt: string;
    readonly posDate: string;

    readonly billingCurrency: string;
    readonly cardNumber: string;
    readonly conversionRate: number;
    readonly discountAmount: number;
    readonly discountType: string;
    readonly quantity: number;
    readonly pricePer: number;
    readonly grandTotal: number;
    readonly fundedTotal: number;
    readonly locationName: string;
    readonly locationState: string;
    readonly prefTotal: number;
    readonly settleAmount: number;

    @Type(() => Vehicle)
    readonly vehicle: Vehicle;
    @Type(() => Company)
    readonly company: Company;
    @Type(() => TransactionLine)
    readonly transactionLines: TransactionLine[];

    constructor() { }
}

export class FuelStation {
    readonly id: string;
    readonly address1: string;
    readonly address2: string;
    readonly amenities: string[];
    readonly city: string;
    readonly defLanes: number;
    readonly dieselLanes: number;
    readonly inProgram: boolean;
    readonly latitude: number;
    readonly longitude: number;
    readonly name: string;
    readonly netPrice: string;
    readonly parkingSpaces: number;
    readonly phone: string;
    readonly priceAsOf: string;
    readonly scale: boolean;
    readonly showers: number;
    readonly state: string;
    readonly storeNumber: string;
    readonly taxRate: number;
    readonly totalPrice: number;
    readonly wifi: number;
    readonly zip: string;

    constructor() { }
}

export class Device {
    readonly id: string;

    @Type(() => ReportingProfile)
    readonly reportingProfile: ReportingProfile;
    @Type(() => Company)
    readonly company: Company;

    readonly iccid: string;
    readonly imei: string;
    readonly serialNumber: string;
    readonly tokenName: string;
    readonly qrCode: string;
    readonly type: string;

    @Type(() => Vehicle)
    readonly lastVehicle: Vehicle;
    readonly softwareVersion: string;
    readonly status: string; // one of DeviceStatus
    readonly deactivatedAt: string;
    readonly createdAt: string;

    @Type(() => Vehicle)
    readonly forceToVehicle: Vehicle;
    readonly lastCommunication: string;
    readonly operationalStatus: string;

    constructor() { }

    isActive(): boolean {
        return "active" === this.status;
    }

    isConnected(): boolean {
        let odometerDefined = this.lastVehicle && this.lastVehicle.lastPosition
            && this.lastVehicle.lastPosition.odometer && this.lastVehicle.lastPosition.odometer > 0;
        let ignition = this.lastVehicle && this.lastVehicle.lastPosition && this.lastVehicle.lastPosition.ignition;
        return !!odometerDefined || !!ignition;
    }
}

export class StripeCustomer {
    readonly id: string;
    readonly default_source: string;
    readonly sources: Source[];

    constructor() { }
}

export class Source {
    readonly id: string;
    readonly name: string;
    readonly object: string;
    readonly address_city: string;
    readonly address_country: string;
    readonly address_line1: string;
    readonly address_line2: string;
    readonly address_state: string;
    readonly address_zip: string;
    readonly brand: string;
    readonly country: string;
    readonly last4: string;

    constructor() { }

    getAddress() {
        let address: string = (this.address_line1 && this.address_line1 + "\n") +
            (this.address_line2 && this.address_line2 + "\n") +
            (this.address_city && this.address_city + ",&nbsp;") +
            (this.address_state && this.address_state + "&nbsp;") +
            (this.address_zip);
        return address || "N/A";
    }
}

export class Point {
    x: number;
    y: number;

    constructor() { }
}

export class Polygon {
    rings: number[][];

    constructor() { }
}

export class MapboxPlace {
    readonly place_name: string;
    readonly center: number[];
    readonly bbox: number[];

    constructor() { }
}

export class DomicileLocation {
    readonly id: string;
    readonly latitude: number;
    readonly longitude: number;
    readonly name: string;
    @Type(() => Point)
    readonly point: Point;
    @Type(() => Polygon)
    readonly polygon: Polygon;
    @Type(() => ConnectionBind)
    readonly connectionBindList: ConnectionBind[];
    readonly locationGroupId: string;
    readonly createdAt: number;
    readonly allowEdit: boolean;
    readonly address1: string;
    readonly address2: string;
    readonly city: string;
    readonly state: string;
    readonly country: string;
    readonly zip: string;

    constructor() { }

    getAddress() {
        let address: string = (this.address1 ? this.address1 + " " : "") +
            (this.address2 ? this.address2 + " " : "") +
            ((this.address1 || this.address2) ? " - " : "") +
            (this.city ? this.city + ", " : "") +
            (this.state ? this.state + " " : "") +
            (this.country ? this.country + " " : "") +
            (this.zip ? this.zip + "" : "");
        return address || "N/A";
    }

    prepareProperties() {
        return {
            // Will be stringified by mapbox, so use `JSON.parse(xxx.properties.asString)` before usage
            asString: this
        }
    }

    isPolygon() {
        return this.polygon && this.polygon.rings && this.polygon.rings.length > 0;
    }

    isPoint() {
        return !!this.point && !!this.point.x;
    }

    prepareGeometry() {
        return {
            type: "Polygon",
            coordinates: this.polygon.rings
        }
    }

    preparePolygonPointGeometry() {
        return {
            type: "Point",
            coordinates: [this.polygon.rings[0][0][0], this.polygon.rings[0][0][1]]
        }
    }

    preparePointGeometry() {
        return {
            type: "Point",
            coordinates: [this.point.x, this.point.y]
        };
    }

    getClickablePoint() {
        return this.isPolygon() ? this.polygon.rings[0][0] : [this.point.x, this.point.y];
    }

    hasLonLat() {
        return !!this.latitude && !!this.longitude;
    }

}

export class LocationWrapper {
    readonly isLocation: boolean;
    readonly entry: any;

    constructor(isLocation: boolean, entry: any) {
        this.isLocation = isLocation;
        this.entry = entry;
    }
}

export class DwellStat {
    readonly date: string; // Date format is: 'YYYY-MM-DD'
    readonly hour: number;
    readonly duration: number;

    constructor() { }
}

export class DwellStatsHelper {
    readonly dwellStats: DwellStat[];

    constructor(dwellStats: DwellStat[]) {
        this.dwellStats = dwellStats;
    }

    getSeriesData(): any[] {
        let result = [];
        this.dwellStats.forEach(ds => {
            let date: Date = moment.utc(ds.date, 'YYYY-MM-DD').toDate();
            date.setUTCHours(ds.hour);

            result.push([date.getTime(), ds.duration]);
        });
        return [result];
    }
}

export class DwellEvent {
    readonly id: string;
    readonly startedAt: string;
    readonly endedAt: string;
    readonly duration: number;

    @Type(() => DomicileLocation)
    readonly location: DomicileLocation;
    @Type(() => Vehicle)
    readonly vehicle: Vehicle;
    readonly createdAt: string;

    constructor() { }
}

export class PositionFormat {
    readonly iconType: string;
    readonly iconColor: string;
    readonly lineAfterColor: string;
    readonly lineAfterType: string;
    readonly allowInsertBefore: boolean;

    constructor() { }
}

export class Position {
    readonly id: string;
    readonly datetime: string;
    readonly latitude: number;
    readonly longitude: number;
    readonly road: string;
    readonly city: string;
    readonly state: string;
    readonly odometer: number;
    readonly driverId: string;
    readonly heading: number;
    readonly speed: number;
    readonly gpsVelocity: number;
    readonly ignition: boolean;
    readonly error: string;
    @Type(() => PositionFormat)
    readonly format: PositionFormat;
    @Type(() => DomicileLocation)
    readonly locations: DomicileLocation[];
    readonly place: string;

    constructor() { }

    getLocation() {
        return (!this.road ? "" : this.road + ", ") +
            (!this.city ? "" : this.city + " ") +
            (!this.state ? "" : this.state);
    }

    getLocationNames() {
        if (!this.locations || this.locations.length === 0) {
            return "";
        }

        return this.locations
            .map(attr => attr.name)
            .join(", ");
    }

    getRotation() {
        return (this.format.iconType === `heading-arrow`) ? this.heading : 0;
    }

    toIcon() {
        switch (this.format.iconType) {
            case `exclamation`:
                return "fa-exclamation";
            case `heading-arrow`:
                return "fa-arrow-up";
            default:
                return "fa-circle";
        }
    }

    isNotProcessed() {
        return this.format && this.format.iconColor === "purple";
    }

    isError() {
        return !!this.error;
    }

}

export class PointFeature {
    positionId: string;
    coordinates: number[];
    rotation: number;
    color: string;
    icon: string;
    hover: boolean

    constructor(positionId: string, coordinates: number[], rotation: number,
        color: string, icon: string) {
        this.positionId = positionId;
        this.coordinates = coordinates;
        this.rotation = rotation;
        this.color = color;
        this.icon = icon;
        this.hover = false;
    }
}

export class PositionsData {
    @Type(() => Position)
    readonly tablePositions: Position[];
    @Type(() => Position)
    readonly mapPositions: Position[];
    readonly resultCount: number;

    constructor() { }

    preparePointFeatures(): PointFeature[] {
        if (!this.tablePositions || this.tablePositions.length === 0) {
            return [];
        }
        let result = [];
        this.tablePositions.forEach(function (p) {
            let next = new PointFeature(
                p.id,
                [p.longitude, p.latitude],
                p.getRotation(),
                p.format.iconColor, p.toIcon());
            result.push(next);
        });
        return result;
    }

    /**
     * Since `line-dasharray` of Mapbox doesn't support property functions, we need to return 2 set
     * of lines: dashed and solid.
     *
     * @see https://github.com/mapbox/mapbox-gl-js/issues/3045
     */
    prepareLineFeatures() {
        if (!this.mapPositions || this.mapPositions.length <= 1) {
            return {
                dotted: [],
                solid: []
            };
        }

        let resultSolid = [];
        let resultDotted = [];
        const amount = this.mapPositions.length;
        for (let i = amount - 1; i > 0; i--) {
            let a = this.mapPositions[i];
            let b = this.mapPositions[i - 1];
            let notProcessed = a.format.lineAfterColor === "none";
            // if (notProcessed) {
            //     continue;
            // }
            let color = notProcessed ? "purple" : a.format.lineAfterColor;
            let width = notProcessed ? 1 : 3;
            let next = {
                geometry: {
                    type: "LineString",
                    coordinates: [
                        [a.longitude, a.latitude],
                        [b.longitude, b.latitude]
                    ]
                },
                properties: {
                    color: color,
                    width: width
                }
            };

            let isDotted = notProcessed || a.format.lineAfterType == "dotted";
            if (isDotted) {
                resultDotted.push(next);
            } else {
                resultSolid.push(next);
            }
        }

        return {
            dotted: resultDotted,
            solid: resultSolid
        };
    }
}

export class FeedbackType {
    readonly id: string;
    readonly name: string;
    readonly type: string;
    readonly createdAt: string;

    constructor() { }
}

export class RoutePolyline {
    readonly srid: number;
    readonly points: number[][];

    constructor() { }
}

export class MapBoxUtil {

    private static left100(array: any[]) {
        if (!array || array.length <= 100) {
            return array;
        }
        const everyNth = (array, nth) => array.filter((element, i) => i % nth === nth - 1 || i === array.length || i === 0);
        let N = Math.round(array.length / 100);
        return everyNth(array, N);
    }

    public static prepareLineLayerFor(points: number[][]) {
        if (!points || points.length <= 1) {
            return [];
        }
        let thePoints = this.left100(points);

        let result = [];
        const amount = thePoints.length;
        for (let i = amount - 1; i > 0; i--) {
            let a = thePoints[i];
            let b = thePoints[i - 1];

            let next = {
                geometry: {
                    type: "LineString",
                    coordinates: [
                        [a[0], a[1]],
                        [b[0], b[1]]
                    ]
                },
                properties: {
                }
            };

            result.push(next);
        }

        return result;
    }

}

export class DispatchRoute {
    @Type(() => RoutePolyline)
    readonly polyline: RoutePolyline;
    readonly duration: number;
    readonly miles: number;

    constructor() { }
}

export class Stop {
    readonly id: string;
    readonly stopOrder: number;
    readonly arriveDate: string;
    readonly completedAt: string;
    readonly type: string; // one of StopType
    readonly loadedType: string; // one of StopLoadType
    readonly createdAt: string;
    readonly appointmentFrom: string;
    readonly appointmentTo: string;
    readonly reportedArrive: string;
    readonly reportedDepart: string;
    readonly observedArrive: string;
    readonly observedDepart: string;

    @Type(() => Address)
    readonly address: Address;
    @Type(() => DomicileLocation)
    readonly location: DomicileLocation;
    @Type(() => FeedbackType)
    readonly requiredFeedbackTypes: FeedbackType[];
    readonly name: string;
    readonly phone: string;
    readonly fax: string;

    readonly loadNo: string;
    readonly bolNo: string;
    readonly deliveryNo: string;
    readonly dimensions: string;
    readonly cargoValue: number; // float value
    readonly plannedServiceTime: number;
    readonly containsHazardousMaterials: boolean;

    readonly plannedArrival: string;
    readonly temperature: number;
    readonly description: string;
    readonly notes: string;
    readonly expectedMiles: number;
    readonly actualMiles: number;

    readonly bookNo: string;
    readonly bookingId: string;

    readonly plannedMiles: number;
    readonly plannedTravelDuration: number;
    @Type(() => RoutePolyline)
    readonly plannedRoute: RoutePolyline;

    constructor() { }

    isLocation() {
        return !!this.location && !!this.location.id;
    }

    getFeedbackTypesText() {
        if (!!this.requiredFeedbackTypes && this.requiredFeedbackTypes.length > 0) {
            return this.requiredFeedbackTypes.map(type => (type.name)).join(", ");
        }
        return "";
    }
}

export class Feedback {
    readonly id: string;
    readonly createdAt: string;
    readonly name: string;
    readonly type: string;
    readonly value: number;
    readonly synced: boolean;

    @Type(() => Stop)
    readonly stop: Stop;
    @Type(() => FeedbackType)
    readonly feedbackType: FeedbackType;

    constructor() { }

    isSynced() {
        return this.synced ? "YES" : "NO";
    }
}

export class Booking {
    readonly id: string;
    readonly status: string;
    readonly bookNo: string;
    readonly billingName: string;
    readonly createdAt: string;
    readonly hold: boolean;
    // readonly bolNo: string; // ?
    // readonly notes: string; // ?

    @Type(() => Address)
    readonly billingAddress: Address;
    @Type(() => Customer)
    readonly customer: Customer;
    @Type(() => VehicleType)
    readonly vehicleType: VehicleType;
    @Type(() => Stop)
    readonly stops: Stop[];

    constructor() { }

    /**
     * Calculates based on the `Stop.appointmentFrom` field.
     */
    filterStops(types?: string[]) {
        return (this.stops || []).filter((s) => (!types || types.length === 0 || types.includes(s.type)) && s.type !== StopType.POSITION);
    }

    getFirstStop(types?: string[]) {
        return _minBy(this.filterStops(types), (s) => new Date(s.appointmentFrom).getTime());
    }

    getLastStop(types?: string[]) {
        return _maxBy(this.filterStops(types), (s) => new Date(s.appointmentFrom).getTime());
    }
}

export class Resource {
    readonly entityType: string; // ResourceType
    readonly entityId: string;
    // @Type(() => VehicleType)
    // readonly vehicleType: VehicleType;
    readonly serviceStatus: string;
    readonly loadStatus: string;

    constructor() { }
}

export class Dispatch {
    readonly id: string;
    @Type(() => Resource)
    readonly resource: Resource;
    // readonly estimatedTimeToCompletion: string,
    readonly createdAt: string;

    constructor() { }
}

export class Trip {
    readonly id: string;
    readonly bookingIds: string[];
    readonly tripNo: string;
    readonly status: string; // TripStatus
    readonly completedAt: string;
    readonly approvedAt: string;
    @Type(() => User)
    readonly createdBy: User;
    readonly dispatchOrder: number;
    @Type(() => Stop)
    readonly stops: Stop[];
    @Type(() => Dispatch)
    readonly dispatches: Dispatch[];
    readonly createdAt: string;
    readonly acknowledgedByMobile: boolean;

    constructor() { }

    hasOneOfStatuses(statuses: string[]): boolean {
        return !!statuses && statuses.includes(this.status);
    }

    /**
     * Calculates based on the `Stop.appointmentFrom` field.
     */
    filterStops(types?: string[]) {
        return (this.stops || []).filter((s) => (!types || types.length === 0 || types.includes(s.type)) && s.type !== StopType.POSITION);
    }

    getFirstStop(types?: string[]) {
        return _minBy(this.filterStops(types), (s) => new Date(s.appointmentFrom).getTime());
    }

    getLastStop(types?: string[]) {
        return _maxBy(this.filterStops(types), (s) => new Date(s.appointmentFrom).getTime());
    }
}

export class ChangeLogInitiator {
    readonly type: string; // ChangeLogInitiatorType
    readonly id: string;
}

export class ChangeLogContext {
    readonly newStatus: string; // TripStatus
    readonly prevStatus: string; // TripStatus

    constructor() { }
}

export class TripChangeLog {
    readonly id: string;
    readonly event: string; // ChangeLogType
    @Type(() => ChangeLogInitiator)
    readonly initiator: ChangeLogInitiator;
    @Type(() => ChangeLogContext)
    readonly context: ChangeLogContext;
    readonly createdAt: string;

    constructor() { }
}

/**
 * Helper item representation class for the Trips list (Dispatch logic)
 */
export class TripsHandlerItem {
    readonly vehicle: Vehicle;
    readonly driver: Driver;
    readonly trips: Trip[];

    constructor(entity: Reportable, trips: Trip[]) {
        this.vehicle = entity instanceof Vehicle ? entity : null;
        this.driver = entity instanceof Driver ? entity : null;
        this.trips = trips;
    }

    getEntity(): Reportable {
        return !!this.vehicle ? this.vehicle : this.driver;
    }
}

export class TripsHandler {

    /**
     * Will be ordered by `Trip.createdAt.DESC` and grouped by the entity (either Driver or Vehicle)
     *
     * @type {TripsHandlerItem[]}
     * @memberof TripsHandler
     */
    private vehicleItems: TripsHandlerItem[];
    private driverItems: TripsHandlerItem[];
    private isInit: boolean = false;

    getItems(entityType: ResourceType): TripsHandlerItem[] {
        if (!this.isInit) {
            throw new Error("Need to call #initWith() first.");
        }
        return entityType === ResourceType.VEHICLE ? this.vehicleItems : this.driverItems;
    }

    readonly trips: Trip[];
    private vehicles: Vehicle[];
    private drivers: Driver[];

    constructor(trips: Trip[]) {
        this.trips = trips;
        // https://github.com/truckspy/truckspyui/issues/676
        // this.trips.forEach(trip => trip.stops.sort((a, b) => {
        //     return new Date(a.appointmentFrom).getTime() - new Date(b.appointmentFrom).getTime();
        // }));
        this.trips.sort((a, b) => {
            if (a.status !== b.status) {
                return a.status === TripStatus.DISPATCHED ? -1 : 1;
            }
            // let s1 = a.getFirstStop([StopType.PICKUP, StopType.PICKUP_DOCK, StopType.TRAILER_POSITION, StopType.TRACTOR_POSITION]);
            // let s2 = b.getFirstStop([StopType.PICKUP, StopType.PICKUP_DOCK, StopType.TRAILER_POSITION, StopType.TRACTOR_POSITION]);
            // if (!s1) return 1;
            // if (!s2) return -1;
            // return new Date(s1.appointmentFrom).getTime() - new Date(s2.appointmentFrom).getTime();
        });
    }

    initWith(vehicles: Vehicle[], drivers: Driver[]) {
        this.vehicles = vehicles;
        this.drivers = drivers;

        this.vehicleItems = this.mapCollection(this.trips, this.vehicles, ResourceType.VEHICLE);
        this.driverItems = this.mapCollection(this.trips, this.drivers, ResourceType.DRIVER);
        this.isInit = true;
    }

    /**
     * Helper method to map trips array to the UI representable array of `TripsHandlerItem` instances.
     *
     * Will return result array ordered similar with the `entities` array order. In our case sorting willl
     * be `remoteId.ASC` for both drivers and vehicles.
     *
     * @private
     * @param {Trip[]} trips array of `Trip` instances to map
     * @param {Reportable[]} entities array of entities (`Vehicle`s or `Driver`s) to do map based on
     * @param {ResourceType} entityType entity type
     * @returns {TripsHandlerItem[]} the result representable array
     * @memberof TripsHandler
     */
    private mapCollection(trips: Trip[], entities: Reportable[], entityType: ResourceType): TripsHandlerItem[] {
        // let entitiesMap = entities.reduce((map: Map<string, Reportable>, item) => map.set(item.id, item), new Map());

        let tripsById = {};
        trips.forEach(function (trip: Trip) {
            if (!!trip.dispatches && trip.dispatches.length > 0) {
                trip.dispatches.forEach(dispatch => {
                    let entityId = dispatch.resource.entityId;
                    if (dispatch.resource.entityType === entityType) {
                        let theTrips = tripsById[entityId];
                        if (!theTrips) {
                            tripsById[entityId] = [trip];
                        } else {
                            theTrips.push(trip);
                        }
                    }
                });
            }
        });

        let result: TripsHandlerItem[] = [];
        entities.forEach((next: Reportable) => {
            let theTrips = tripsById[next.id];
            if (!!theTrips) {
                let item = new TripsHandlerItem(next, theTrips);
                result.push(item);
            }
        });
        result.sort((a, b) => {
            let s1 = a.trips[0].status;
            let s2 = b.trips[0].status;
            if (s1 === s2) {
                return 0;
            }
            return s1 === TripStatus.DISPATCHED ? -1 : 1;
        });

        return result;
    }
}

export class TripResourcesHandler {
    readonly item: TripsHandlerItem;

    constructor(item: TripsHandlerItem) {
        this.item = item;
    }

    /**
     * Returned structure is as below:
     * `{
     *      entityId: ...,
     *      entityType: ...,
     *      editable: true,
     *      removable: false,
     *      entity: ...
     * }`
     *
     * If non-editable and non-removable: will be all disabled on UI.
     * If editable and non-removable: only `entityType` will be disabled on UI.
     * If editable and removable: none will be disabled and line will be possible to be removed.
     * @param {Vehicle[]} vehicles list of all applicable (of the specified type) vehicles
     * @param {Driver[]} drivers list of all active drivers
     */
    getInitResource(vehicles: Vehicle[], drivers: Driver[]): any[] {
        let result = [];
        let vehicleFound = false;
        let driverFound = false;
        if (!!this.item && !!this.item.trips && this.item.trips.length > 0) {
            this.item.trips[0].dispatches.forEach(dispatch => {
                let collection: Reportable[] = (dispatch.resource.entityType === ResourceType.DRIVER) ? drivers : vehicles;
                let reportable: Reportable = collection.find(function (next) {
                    return next.id === dispatch.resource.entityId;
                });
                if (!!reportable) {
                    vehicleFound = vehicleFound || dispatch.resource.entityType === ResourceType.VEHICLE;
                    driverFound = driverFound || dispatch.resource.entityType === ResourceType.DRIVER;
                    result.push({
                        entityId: dispatch.resource.entityId,
                        entityType: dispatch.resource.entityType,
                        editable: false,
                        removable: false,
                        entity: reportable
                    });
                }
            });
        }

        if (!vehicleFound) {
            result.push({
                entityId: !!vehicles && vehicles.length > 0 && vehicles[0].id || "",
                entityType: ResourceType.VEHICLE,
                editable: true,
                removable: false,
                entity: !!vehicles && vehicles.length > 0 && vehicles[0] || null
            });
        }
        if (!driverFound) {
            result.push({
                entityId: !!drivers && drivers.length > 0 && drivers[0].id || "",
                entityType: ResourceType.DRIVER,
                editable: true,
                removable: false,
                entity: !!drivers && drivers.length > 0 && drivers[0] || null
            });
        }

        return result;
    }
}

export class LastTimeEntry {
    readonly id: string;
    readonly status: string;
    readonly vehicleId: string;
    @Type(() => Position)
    readonly lastPosition: Position;

    constructor() { }
}

export class DriverFeatures {
    readonly hoursOfService: boolean;
    readonly dispatching: boolean;
    readonly frontline: boolean;
    readonly maintenance: boolean;
    readonly devicesEnabled: boolean; // Will be introduced, need to double-check: https://github.com/truckspy/truckspyapp/issues/844

    constructor() { }
}

export class Driver extends Reportable {
    readonly remoteId: string;
    readonly status: string;
    readonly firstName: string;
    readonly lastName: string;
    fullName: string; // for ng-select bindLabel only
    @Type(() => ReportingProfile)
    readonly reportingProfile: ReportingProfile;
    readonly visTracksId: string;
    readonly alias: string;
    @Type(() => ConnectionBind)
    readonly connectionBindList: ConnectionBind[];
    @Type(() => ReportingProfileHistory)
    readonly reportingProfileHistory: ReportingProfileHistory[];
    @Type(() => LastTimeEntry)
    readonly lastTimeEntry: LastTimeEntry;

    readonly username: string;
    readonly newPassword: string;
    readonly canEdit: boolean;

    readonly licenseNumber: string;
    readonly licenseState: string;
    readonly licenseExpiration: string;

    @Type(() => DispatchGroup)
    readonly dispatchGroup: DispatchGroup;
    @Type(() => Attribute)
    readonly editableAttributes: Attribute[];
    @Type(() => DriverFeatures)
    readonly featuresEnabled: DriverFeatures;

    constructor() {
        super();
    }

    name(): string {
        let first: string = this.firstName || "";
        let last: string = this.lastName || "";
        return `${first} ${last}`;
    }

    isActive(): boolean {
        return Status.ACTIVE === this.status;
    }

    hasLastLogEntry(): boolean {
        let noEntry: boolean = !this.lastTimeEntry || !this.lastTimeEntry.id;
        return !noEntry;
    }
}

export class DriverViolationDocumentMedia {
    readonly name: string;
    readonly filename: string;
    readonly isParent: boolean;
    readonly accountId: number;
    readonly id: number;
}
export class DriverViolationObject {
    readonly message: string;
    readonly timestamp: string;
    readonly title: string;
    readonly drivingRuleType: string;
    readonly toolTipText: string;
    readonly iconLabel: string
}
export class DriverViolationDocument {
    readonly userId: number;
    readonly driverViolationId: number;
    readonly note: string;
    readonly media: DriverViolationDocumentMedia[];
    readonly accountId: number;
    readonly id: number;
    readonly changedBy: string;
    readonly lastChangedDate: string;
}
export class DriverViolations {
    readonly userId: number;
    readonly driverHistoryId: number;
    readonly timestamp: string;
    readonly violationName: string;
    readonly iconLabel: string;
    readonly limit: string;
    readonly terminalId: number;
    readonly subsetId: number;
    readonly accountId: number;
    readonly id: number;
    readonly lastChangedDate: string;
    readonly cycleResetTimestamp: string | null;
    readonly shiftResetTimestamp: string | null;
    readonly breakResetTimestamp: string | null;
    readonly violations: {
        readonly DriverViolations: DriverViolationObject[]
    };
}

export class DriverHistoriesUnidentifiedDrivingEvents {
    readonly userId: number;
    readonly uuid: string;
    readonly location: string;
    readonly driverEdit: boolean;
    readonly note: string;
    readonly latitude: number;
    readonly longitude: number;
    readonly odometerKm: number;
    readonly editReason: string;
    readonly useCycleReset: boolean;
    readonly validBeginTime: string;
    readonly validEndTime: string;
    readonly vin: string;
    readonly certificationCount: number;
    readonly recordStatus: string;
    readonly engineHours: string;
    readonly username: string;
    readonly distanceLastGpsKm: number;
    readonly malfunctionIndicator: boolean;
    readonly diagnosticIndicator: boolean;
    readonly dataCheck: number;
    readonly eventType: string;
    readonly recordOrigin: string;
    eventTime: string;
    readonly assetId: number;
    readonly state: string;
    readonly autoEventEndTimestamp: string;
    readonly gpsSource: string;
    readonly regulationMode: string;
    readonly odometerSource: string;
    readonly speedKph: number;
    readonly accountId: number;
    readonly id: number;
    readonly iftaState: string;
    readonly editReasonCode: string;
    readonly lastChangedDate: string;
    startOdometerInKm: number;
    startOdometerInMi: number;
    endOdometerInKm: number;
    endOdometerInMi: number;
    accumulatedMiles: number;
    isChecked: boolean;

    onStartOdometerInMi(): number {
        // convert start odometer reading from Km to miles
        let odokm: number = this.startOdometerInKm || 0;
        return Number((Math.round((0.621371192 * odokm) * 10) / 10).toFixed(0))
    }

    onEndOdometerInMi(): number {
        // convert end odometer reading from Km to miles
        let odokm: number = this.endOdometerInKm || 0;
        return Number((Math.round((0.621371192 * odokm) * 10) / 10).toFixed(0))
    }
}

export class Terminal {
    readonly accountId: number;
    readonly city: string;
    readonly country: string;
    readonly id: number;
    readonly lastChangedDate: string;
    readonly latitude: number;
    readonly longitude: number;
    readonly mainOffice: boolean;
    readonly name: string;
    readonly phoneNumber: string;
    readonly postalCode: string;
    readonly startTimeOfDay: string;
    readonly state: string;
    readonly street: string;
    readonly timeZone: string;
}

export class Subset {
    readonly accountId: number;
    readonly id: number;
    readonly isDefault: boolean;
    readonly name: string;
    readonly terminalId: number;
}

export class Violations {
    readonly accountId: number;
    readonly id: number;
    readonly isDefault: boolean;
    readonly name: string;
    readonly terminalId: number;
}

export class DriverHistory {
    readonly id: number;
    readonly userId: string;
    readonly uuid: string;
    readonly location: string;
    readonly driverEdit: false;
    readonly note: string;
    readonly latitude: number;
    readonly longitude: number;
    readonly odometerKm: number;
    readonly odometerSource: String;
    readonly editReason: string;
    readonly useCycleReset: boolean;
    readonly validBeginTime: string;
    readonly vin: string;
    readonly certificationCount: number;
    readonly recordStatus: string;
    readonly engineHours: string;
    readonly username: string;
    readonly distanceLastGpsKm: number;
    readonly malfunctionIndicator: boolean;
    readonly diagnosticIndicator: boolean;
    readonly dataCheck: number;
    readonly eventType: string;
    readonly recordOrigin: string;
    readonly eventTime: string;
    readonly assetId: number;
    readonly eventSequenceIdentifier: number;
    readonly state: string;
    readonly gpsSource: string;
    readonly regulationMode: string;
    readonly speedKph: number;
    readonly canAdlHoursDriving: string;
    readonly canAdlHoursOffDuty: string;
    readonly canAdlHoursOnDuty: string;
    readonly canAdlHoursSleeper: string;
    readonly canOffDutyTimeDeferred: string;
    readonly accountId: number;
    readonly remoteId: string;
    readonly iftaState: string;
    readonly editReasonCode: string;
    readonly lastChangedDate: string;
    readonly excludeDrivingEndTimestamp: string;
    readonly toolTipText: string;
    readonly changeRequestedByName: string;
    readonly changeRequestedBy: number;
    violations: { DriverViolations: DriverViolationObject[] };
    cycleResetTimestamp: string | null;

    vehicleName: string;
    hour11Violation: boolean;
    hour14Violation: boolean;
    hour30Violation: boolean;
    hour34Violation: boolean;
    hour70Violation: boolean;

    odometer(): string {
        // convert odometer reading from Km to miles
        let odokm: number = this.odometerKm || 0;
        return (Math.round((0.621371192 * odokm) * 10) / 10).toFixed(2);
    }

    addHour11Violation() {
        this.hour11Violation = true;
    }

    addHour14Violation() {
        this.hour14Violation = true;
    }

    addHour30Violation() {
        this.hour30Violation = true;
    }

    addHour34Violation() {
        this.hour34Violation = true;
    }

    addHour70Violation() {
        this.hour70Violation = true;
    }

    setVehicle(vehicleName: string) {
        this.vehicleName = vehicleName;
    }
}

export class DriverHistoryUpdateDetails {
    readonly id: number;
    readonly userId: string;
    readonly uuid: string;
    location: string;
    driverEdit: boolean;
    note: string;
    readonly latitude: number;
    readonly longitude: number;
    odometerKm: number;
    odometerMi: number;
    editReason: string;
    readonly useCycleReset: boolean;
    readonly validBeginTime: string;
    readonly vin: string;
    readonly certificationCount: number;
    readonly recordStatus: string;
    readonly engineHours: string;
    readonly username: string;
    readonly distanceLastGpsKm: number;
    readonly malfunctionIndicator: boolean;
    readonly diagnosticIndicator: boolean;
    readonly dataCheck: number;
    eventType: string;
    readonly recordOrigin: string;
    eventTime: string;
    date: string;
    time: string;
    readonly assetId: number;
    readonly eventSequenceIdentifier: number;
    state: string;
    readonly gpsSource: string;
    readonly regulationMode: string;
    readonly odometerSource: string;
    readonly speedKph: number;
    readonly canAdlHoursDriving: string;
    readonly canAdlHoursOffDuty: string;
    readonly canAdlHoursOnDuty: string;
    readonly canAdlHoursSleeper: string;
    readonly canOffDutyTimeDeferred: string;
    readonly accountId: number;
    readonly remoteId: string;
    readonly iftaState: string;
    readonly editReasonCode: string;
    readonly lastChangedDate: string;
    readonly excludeDrivingEndTimestamp: string;
    personalConveyance: boolean;
    yardMoves: boolean;

    readonly vehicleName: string;

    constructor() { }

    public odometerToMi(): string {
        // convert odometer reading from Km to Miles
        let odokm: number = this.odometerKm || 0;
        return (.621371 * odokm).toFixed(2);
    }

    public odometerToKm(): string {
        // convert odometer reading from Miles to Km
        let odomi: number = this.odometerMi || 0;
        return (odomi / .621371).toFixed(2);
    }
}

export enum VISTRACKS_EXCEPTIONS { // VisTracks supports Canada and USA exceptions
    AdverseDrivingConditions = "AdverseDrivingConditions",
    Agricultural = "Agricultural",
    Asphalt30MinOnDutyBreak = "Asphalt30MinOnDutyBreak",
    CaliforniaTankDriver = "CaliforniaTankDriver", // for California cycles only
    DriverSalesPerson = "DriverSalesPerson",
    DrivingWindow16Hour = "DrivingWindow16Hour",
    EmergencyConditions = "EmergencyConditions",
    HazMatInAttendanceBreak = "HazMatInAttendanceBreak",
    HiRail = "HiRail",
    MichiganSeasonalConstruction = "MichiganSeasonalConstruction", // for Michigan cycles only
    NotCmv = "NotCmv",
    OilFieldOperations = "OilFieldOperations",
    OversizeLoads = "OversizeLoads",
    PetroleumNoBreak = "PetroleumNoBreak",
    ShortHaul12HourNoBreak = "ShortHaul12HourNoBreak",
    ShortHaulNoBreak = "ShortHaulNoBreak",
    ShortHaulNoLog = "ShortHaulNoLog",
    ShortHaulReadyMixed = "ShortHaulReadyMixed",
    StateOfEmergency = "StateOfEmergency",
    TransportOfBeesOrLivestock = "TransportOfBeesOrLivestock",
    TwentyFourHourRestart = "TwentyFourHourRestart",
    UtilityServiceVehicle = "UtilityServiceVehicle",
    MinnesotaConstruction = "MinnesotaConstruction",

    CanFerry = "CanFerry",
    CanSpecialPermit = "CanSpecialPermit",
    CanOilWellServicePermit = "CanOilWellServicePermit",
    CanEmergencyConditions = "CanEmergencyConditions",
    CanAdverseDrivingConditions = "CanAdverseDrivingConditions",
    CanLocalNoLog = "CanLocalNoLog"
}

export class DriverDailies {
    readonly userId: string;
    readonly cargo: string;
    readonly carrier: string;
    readonly carrierDotNumber: number;
    readonly certified: boolean;
    @Type(() => CoDriverHistory)
    readonly coDriverHistory: CoDriverHistory[];
    readonly coDriverName: string;
    @Type(() => CoDriverHistory)
    readonly coDrivers: CoDriverHistory[];
    readonly cycleCan: string;
    readonly cycleMex: string;
    readonly cycleUsa: string;
    readonly date: string;
    readonly driverFullName: string;
    readonly exceptions: VISTRACKS_EXCEPTIONS; // one of VISTRACKS_EXCEPTIONS
    readonly homeTerminalAddress: string;
    readonly logDate: string;
    readonly mainOfficeAddress: string;
    readonly manualLog: boolean;
    readonly shippingDocsManifestNo: string;
    readonly shippingDocsShipperCommodity: string;
    readonly startTimeOfDay: string;
    readonly homeTerminalTimeZone: string;
    readonly trailersAttached: TrailersAttached[];
    readonly useGpsOdometer: boolean;
    readonly username: string;
    @Type(() => CoDriverHistory)
    readonly vehicle: CoDriverHistory;
    @Type(() => CoDriverHistory)
    readonly vehicleHistory: CoDriverHistory[];
    readonly vehicleId: string;
    readonly canOffDutyDeferDay: string;
    readonly accountId: number;
    readonly id: number;
    readonly carrierUsDotNumber: string;
    readonly cycleCa: string;
    readonly driverName: string;
    readonly timeZone: string;
    readonly lastChangedDate: string;
    readonly operatingZone: string;
    readonly canOffDutyDefer: string;
    totalMileageInMi: number;

    public onTotalMileageInMi(lastOdometerKM: number = 0, firstOdometerKM: number = 0): number {
        // convert odometer reading from Km to Miles and return total mileage in miles
        return Number((Math.round((0.621371192 * (lastOdometerKM - firstOdometerKM)) * 10) / 10).toFixed(0));
    }
}

export class DriverDailiesUtil {
    readonly dailies: DriverDailies[];

    constructor(dailies: DriverDailies[]) {
        this.dailies = dailies;
    }

    public getExceptions(date: string): any {
        let result = {
            usa: [],
            canada: []
        };
        if (!this.dailies || this.dailies.length == 0) {
            return result;
        }

        this.dailies
            .filter(
                daily => daily.date == date && !!daily.exceptions)
            .forEach((next: DriverDailies) => {
                let usaValue = DriverDailiesUtil.usaExceptionsMap.get(next.exceptions);
                if (!!usaValue) {
                    result.usa.push(usaValue);
                }
                let canadaValue = DriverDailiesUtil.canadaExceptionsMap.get(next.exceptions);
                if (!!canadaValue) {
                    result.canada.push(canadaValue);
                }
            });
        return result;
    };

    private static usaExceptionsMap = new Map([
        [VISTRACKS_EXCEPTIONS.AdverseDrivingConditions, "2 Hour Driving Extension for Adverse Driving Conditions - 395.1(b)(1)"],
        [VISTRACKS_EXCEPTIONS.Agricultural, "No logs for Agricultural Operations - 395.1(k)"],
        [VISTRACKS_EXCEPTIONS.Asphalt30MinOnDutyBreak, "30 Minute OnDuty break for Asphalt drivers"],
        [VISTRACKS_EXCEPTIONS.CaliforniaTankDriver, "California flammable tank drivers may drive 10 hours within a work shift - 13 CCR 1212.5(a)"],
        [VISTRACKS_EXCEPTIONS.DriverSalesPerson, "Driver-salesperson whose total driving time does not exceed 40 hours in any period of 7 consecutive days - 395.1(c)"],
        [VISTRACKS_EXCEPTIONS.DrivingWindow16Hour, "16 Hour Work Shift Once Per Week - 395.1(o)"],
        [VISTRACKS_EXCEPTIONS.EmergencyConditions, "Relief from All Driving Rules for Emergency Conditions - 395.1(b)(2)"],
        [VISTRACKS_EXCEPTIONS.HazMatInAttendanceBreak, "30 Minute in-attendance break for HazMat drivers - 395.1(q)"],
        [VISTRACKS_EXCEPTIONS.HiRail, "Hi-rail 2 hour travel exclusion - 395.1(w)"],
        [VISTRACKS_EXCEPTIONS.MichiganSeasonalConstruction, "Michigan seasonal construction 70/80 and may drive 12 hours during a 16 hour shift"],
        [VISTRACKS_EXCEPTIONS.NotCmv, "No Logs for Non Commercial Motor Vehicle"],
        [VISTRACKS_EXCEPTIONS.OilFieldOperations, "Oilfield Operations with 24 hour restart - 395.1(d)"],
        [VISTRACKS_EXCEPTIONS.OversizeLoads, "30 Minute Break Exemption for Oversize/Overweight Loads - 395.3(a)(3)(ii)"],
        [VISTRACKS_EXCEPTIONS.PetroleumNoBreak, "30 Minute Break Exemption for Petroleum Tank Drivers - FR Vol83No68"],
        [VISTRACKS_EXCEPTIONS.ShortHaul12HourNoBreak, "30 Minute Break Exemption for Short-haul Drivers (12 hour shift) - 395.1(e)(1)"],
        [VISTRACKS_EXCEPTIONS.ShortHaulNoBreak, "30 Minute Break Exemption for Short-haul Drivers (14 hour shift) - 395.1(e)(1)"],
        [VISTRACKS_EXCEPTIONS.ShortHaulNoLog, "No Logs for CDL short-haul Drivers operating within 100 air miles (12 hour shift) - 395.1(e)(1)"],
        [VISTRACKS_EXCEPTIONS.ShortHaulReadyMixed, "No Logs for short-haul Asphalt, Ready-Mixed Concrete Drivers, or Non-CDL-Drivers operating within 150 air miles (14 hour shift) - 395.1(e)(2)"],
        [VISTRACKS_EXCEPTIONS.StateOfEmergency, "Relief from Driving rules for State of Emergency - 390.23"],
        [VISTRACKS_EXCEPTIONS.TransportOfBeesOrLivestock, "30 Minute Break Exemption for Commercial Bees, Livestock Transportation - 395.1(u,v)"],
        [VISTRACKS_EXCEPTIONS.TwentyFourHourRestart, "24 Hour Restart for Construction, Groundwater well-drilling - 395.1(l,m)"],
        [VISTRACKS_EXCEPTIONS.UtilityServiceVehicle, "Relief from All Driving Rules for Utility Service Vehicles - 395.1(n)"],
        [VISTRACKS_EXCEPTIONS.MinnesotaConstruction, "No Logs for Construction Equipment operating within 50-mile radius - 221.025 (8)"],
    ]);

    private static canadaExceptionsMap = new Map([
        [VISTRACKS_EXCEPTIONS.CanAdverseDrivingConditions, "2 Hour Driving Extension for Adverse Driving Conditions - Section 76(2,3)"],
        [VISTRACKS_EXCEPTIONS.CanEmergencyConditions, "CanEmergency Conditions - Section 76(1)"],
        [VISTRACKS_EXCEPTIONS.CanLocalNoLog, "No logs for drivers operating within 160km of home terminal - Section 81"],
        [VISTRACKS_EXCEPTIONS.CanOilWellServicePermit, "Oil Well Service Permit - Section 63"],
        [VISTRACKS_EXCEPTIONS.CanSpecialPermit, "Hour Driving Extension Special Permit - Section 62"],
        [VISTRACKS_EXCEPTIONS.CanFerry, "Ferry Crossing More than 5 hours - Section 17"]
    ]);
}

export class TrailersAttached {
    readonly name: string;
}

export class CoDriverHistory {
    readonly id: string;
    readonly name: string;

    constructor() { }
}

export class FilterDriversOption {
    selectedDispatchGroupId: number | string;
    selectedDriverIds?: (number | string)[];    // drivers ids for selected dispatch group
    selectedDriverId: number | string;
    selectedTerminalId: number | string;
    selectedSubsetId: number | string;
    selectedStatus: boolean;
}

export class FilterViolationOption {
    selectedDispatchGroupId: number | string;
    selectedDriverIds?: (number | string)[];    // drivers ids for selected dispatch group
    selectedDriverId: number | string;
    dateRange: Array<Date>;
    ISODateRange: Array<string>;
    selectedTerminalId: number | string;
    selectedSubsetId: number | string;
    selectedViolationId: number | string;
}

export class FilterAlertOption {
    selectedVehicleId: string;
    selectedDriverId: string;
    reviewed: string; // 0 - Not Reviewed, 1 - Reviewed, '' - All
    status: string; // one of DriveAlertStatus
    sentToDriver: string; // 0 - Not Sent, 1 - Sent, '' - All
    coachingCompleted: string; // 0 - Incompleted, 1 - Completed, '' - All
}

export class FilterSafetyDashboard {
    reportingProfileId: string;
    dispatchGroupId: string;
}

export class FilterUnidentifiedDrivingOption {
    selectedVehicleId: number[];
    dateRange: Array<Date>;
    ISODateRange: Array<string>;
    selectedTerminalId: number | string;
    isUnassigned: boolean = true;
    isClassified: boolean = false;
}

export class FilterLinehaulTrips {
    entityId: string;
    vehicleRemoteId: string;
    driverRemoteId: string;
    beginDate: string;
    endDate: string;
}

export class RequestVideoOption {
    status: string;    // 'pending', 'failed', 'fullfilled'
}

export class VehicleList { // vistrack API return same named object.
    readonly id: number;
    readonly name: string;
}

export class SingleAssignUnidentifiedDriving {
    userId: number;
    driverId: number = null;
    readonly uuid: string;
    readonly location: string;
    readonly driverEdit: boolean;
    note: string;
    readonly latitude: number;
    readonly longitude: number;
    readonly odometerKm: number;
    readonly editReason: string;
    readonly useCycleReset: boolean;
    readonly validBeginTime: string;
    readonly validEndTime: string;
    readonly vin: string;
    readonly certificationCount: number;
    readonly recordStatus: string;
    readonly engineHours: string;
    readonly username: string;
    readonly distanceLastGpsKm: number;
    readonly malfunctionIndicator: boolean;
    readonly diagnosticIndicator: boolean;
    readonly dataCheck: number;
    readonly eventType: string;
    readonly recordOrigin: string;
    readonly eventTime: string;
    readonly assetId: number;
    readonly state: string;
    readonly autoEventEndTimestamp: string;
    readonly gpsSource: string;
    readonly regulationMode: string;
    readonly odometerSource: string;
    readonly speedKph: number;
    readonly accountId: number;
    readonly id: number;
    readonly iftaState: string;
    readonly editReasonCode: string;
    readonly lastChangedDate: string;
    readonly startOdometerInKm: number;
    readonly startOdometerInMi: number;
    readonly endOdometerInKm: number;
    readonly endOdometerInMi: number;
    readonly accumulatedMiles: number;
    readonly isChecked: boolean;

    onStartOdometerInMi(): number {
        // convert start odometer reading from Km to miles
        let odokm: number = this.startOdometerInKm || 0;
        return Number((Math.round((0.621371192 * odokm) * 10) / 10).toFixed(0))
    }

    onEndOdometerInMi(): number {
        // convert end odometer reading from Km to miles
        let odokm: number = this.endOdometerInKm || 0;
        return Number((Math.round((0.621371192 * odokm) * 10) / 10).toFixed(0))
    }
}

export class FilterMalfunctionsOption {
    eventType: string | 'all';
    eventSpecificType: string | 'all';
    remarkDescription: string;
    dateRange: Array<Date>;
    ISODateRange: Array<string>;
    isCleared: boolean | 'all';
    selectedDispatchGroupId: number | string;
    selectedDriverIds?: (number | string)[];    // drivers ids for selected dispatch group
    selectedDriverId: number | 'all';
    selectedVehicleId: number[];
}

export class FilterReportOption {
    dateRange: Array<Date> = [];
    ISODateRange: Array<string> = [];
    onlyDate: Array<string> = [];
    userId: number | 'all';
    assetId: number | 'all';
    assetIdArr: number[] = [];
    selectedUserIdArr: Array<number>;
    terminalId: number | 'all';
    exportType: string;
    driverVehicleUnitType: string;
    isCertified: boolean = false;
    informationType: string;
    driverHistoryUpdateDataReason: string;
    isUnidIncluded: boolean;
    eventType: string | 'all';
    usagePer: string;
    usageMonth: string;
}

export class EldMalfunction {
    readonly assetId: number;
    readonly userId: number;
    readonly eventType: string;
    readonly beginTimestamp: string;
    readonly driverHistoryUUID: string;
    readonly endTimestamp: any;
    readonly accountId: number;
    readonly description: string;
    readonly id: number;
    readonly vin: string;
    readonly lastChangedDate: string;
}

export class AddressMyAccount {
    readonly street: string;
    readonly state: string;
    readonly city: string;
    readonly postalCode: string;
}

export class FeaturesMyAccount {
    readonly ifta: boolean;
    readonly map: boolean;
    readonly eld: boolean
}

export class MyAccount {
    readonly accountToken: string;
    readonly address: AddressMyAccount;
    readonly allowSubAccountBranding: boolean;
    readonly canCreateReseller: boolean;
    readonly deactivated: boolean;
    readonly features: FeaturesMyAccount;
    readonly id: number;
    readonly isGoodStanding: boolean;
    readonly isReseller: boolean;
    readonly name: string;
    readonly productIds: number[];
    readonly resellableProducts: any[];
    readonly topLevel: boolean;
    readonly uuid: string;
}

export class FilterFmcsaDataTransferOption {
    selectedDriverId: number[];
    selectedVehicleId: number[];
    dateRange: Array<Date>;
    ISODateRange: Array<string>;
    comment: string;
}

export class FilterLogEditsOption {
    selectedDispatchGroupId: number | string;
    selectedDriverIds?: (number | string)[];    // drivers ids for selected dispatch group
    selectedDriverId: number | 'all';
    selectedTerminalId: number | 'all';
    dateRange: Array<Date>;
    ISODateRange: Array<string>;
    isFilterByDriverId: boolean;
    logType: string | 'all';
}

export class FilterScheduledDashboard {
    dispatchGroupId: string;
    reportingProfileId: string;
    maintenanceGroupId: string;
    showingFilterItem: string;
}

export class MessageImage {
    readonly id: string;
    readonly createdAt: string;

    constructor() { }
}

export class Message {
    readonly id: string;
    readonly status: string;
    readonly draft: boolean;
    readonly read: boolean;
    @Type(() => MessageImage)
    readonly images: MessageImage[];
    /**
     * `App\\Entity\\Driver` or `App\\Entity\\Company`
     */
    readonly sender: string;
    readonly senderId: string;
    /**
     * `App\\Entity\\Driver` or `App\\Entity\\Company`
     */
    readonly receiver: string;
    readonly receiverId: string;
    readonly subject: string;
    readonly body: string;
    acknowledged: boolean;
    archived: boolean;
    readonly createdAt: string;

    /**
     * Marks message as an acknowledged one (we don't have `GET /api/common/messages/{id}`).
     */
    markAcknowledged() {
        this.acknowledged = true;
    }
    /**
     * Marks message as an archived one (we don't have `GET /api/common/messages/{id}`).
     */
    markArchived() {
        this.archived = true;
    }
    /**
     * Marks message as an unarchived one (we don't have `GET /api/common/messages/{id}`).
     */
    markUnarchived() {
        this.archived = false;
    }

    toDriver(): boolean {
        return this.receiver === "App\\Entity\\Driver";
    }

    fromDriver(): boolean {
        return this.sender === "App\\Entity\\Driver";
    }

    getBodyTeaser() {
        if (!this.body) {
            return "";
        }
        let clearBody = this.body.replace(/<[^<>]+?>/gm, ' ').replace(/(\s{2}|\n)/gm, ' ');
        let teaserMaxLength = 40;
        return clearBody.length > teaserMaxLength ? clearBody.substring(0, teaserMaxLength) + '...' : clearBody;
    }

    getSubjectTeaser() {
        if (!this.subject) {
            return "";
        }
        let teaserMaxLength = 40;
        return this.subject.length > teaserMaxLength ? this.subject.substring(0, teaserMaxLength) + '...' : this.subject;
    }
}

export class LocationGroup {
    readonly id: string;
    readonly name: string;
    readonly allowEdit: boolean;
    readonly createdAt: string;
    readonly locationCount: number;

    constructor() {
    }

    isGlobal(): boolean {
        return !this.allowEdit;
    }
}

export class EnginePosition {
    readonly rpm: number;
    readonly speed: number;
    readonly ignition: boolean;
    readonly idling: boolean;
    readonly fuelLevel: number;
    readonly defLevel: number;
    readonly engineHours: number;
    readonly odometer: number;

    constructor() { }
}

export class EngineSnapshot {
    @Type(() => EnginePosition)
    readonly position: EnginePosition;
    readonly locationString: string;
    readonly timeAgo: string;
    @Type(() => Driver)
    readonly driver: Driver;

    constructor() { }
}

export class Vehicle extends Reportable {
    readonly remoteId: string;
    readonly status: string;
    readonly createdAt: string;
    readonly deletedAt: string;
    readonly dataProcessedThrough: string;
    @Type(() => ReportingProfile)
    readonly reportingProfile: ReportingProfile;
    @Type(() => ReportingProfileHistory)
    readonly reportingProfileHistory: ReportingProfileHistory[];
    @Type(() => Position)
    readonly lastPosition: Position;
    @Type(() => Operation)
    readonly lastOperation: Operation;
    @Type(() => ConnectionBind)
    readonly connectionBindList: ConnectionBind[];
    readonly gpsDataQualityEnforcement: number;
    readonly validGpsQualityEnforcement: any;
    readonly autoFix: boolean;
    readonly category: string;

    readonly dataError: boolean;
    readonly dataErrorAt: string;
    readonly dataErrorIgnoreEligible: boolean;
    @Type(() => DomicileLocation)
    readonly domicileLocation: DomicileLocation;
    @Type(() => InspectionConfig)
    readonly inspectionConfig: InspectionConfig;
    @Type(() => Driver)
    readonly driver: Driver;

    readonly year: number;
    readonly make: string;
    readonly model: string;
    readonly vin: string;
    readonly secondaryVin: string;
    readonly canEdit: boolean;

    @Type(() => VehicleType)
    readonly type: VehicleType; // GET /api/web/vehicles/{vehicleId} returns `type`
    @Type(() => VehicleType)
    readonly vehicleType: VehicleType; // GET /api/web/vehicles returns `vehicleType`
    @Type(() => DispatchGroup)
    readonly dispatchGroup: DispatchGroup;
    @Type(() => Attribute)
    readonly editableAttributes: Attribute[];

    @Type(() => MaintenanceGroup)
    readonly maintenanceGroups: MaintenanceGroup[];

    constructor() {
        super();
    }

    isActive(): boolean {
        return Status.ACTIVE === this.status;
    }

    hasLastPosition(): boolean {
        let noEntry: boolean = !this.lastPosition || !this.lastPosition.id;
        return !noEntry;
    }

    gpsEnforcement() {
        if (!this.validGpsQualityEnforcement) {
            return null;
        }
        let resultKey = Object.keys(this.validGpsQualityEnforcement).find(function (key) {
            return this.validGpsQualityEnforcement[key] === this.gpsDataQualityEnforcement;
        }.bind(this));
        return resultKey;
    }

    gpsEnforcementValues() {
        if (!this.validGpsQualityEnforcement) {
            return [];
        }

        let itself = this;
        let result = [];
        Object.keys(this.validGpsQualityEnforcement).forEach(function (key: string) {
            let value = itself.validGpsQualityEnforcement[key];
            result.push({ key: key, value: value });
        });
        return result;
    }

}

export class Question {
    readonly id: string;
    readonly text: string;
    readonly allowImage: boolean;
    readonly requireDescription: boolean;
    readonly status: boolean;
    readonly createdAt: string;

    @Type(() => InspectionConfig)
    readonly inspectionConfigs: InspectionConfig[];

    constructor() { }

    requireDescriptionLabel() {
        return this.requireDescription ? "YES" : "NO";
    }

    allowImageLabel() {
        return this.allowImage ? "YES" : "NO";
    }
}

export class ConfigQuestion {
    @Type(() => Question)
    readonly question: Question;

    constructor() { }
}

export class InspectionConfig {
    readonly id: string;
    readonly name: string;
    readonly editable: boolean;

    @Type(() => Company)
    readonly company: Company;
    @Type(() => ConfigQuestion)
    readonly questions: ConfigQuestion[];
    @Type(() => Vehicle)
    readonly vehicles: Vehicle[];
    readonly defaultTractorInspection: boolean;
    readonly defaultTrailerInspection: boolean;

    constructor() { }

    nameMatches(term: string) {
        console.log(term);
        return !term || (!!this.name && this.name.toLowerCase().includes(term.toLowerCase()));
    }
}

export class Answer {
    readonly id: string;
    readonly description: string;
    readonly answer: boolean;
    readonly hasImage: boolean;

    @Type(() => Question)
    readonly question: Question;
    @Type(() => MaintenanceIssue)
    readonly issue: MaintenanceIssue;

    // Helper field to be used within Inspection Details page
    show: boolean = false;

    constructor() { }

    yesNo() {
        return this.answer ? "YES" : "NO";
    }
}

export enum InspectionType {
    PRETRIP = 'pretrip',
    POSTTRIP = 'posttrip'
}

export class Inspection {
    readonly id: string;
    readonly inspectionNum: number;
    readonly defectCount: number;
    readonly safe: boolean;
    readonly hasImage: boolean;
    readonly type: string; // one of InspectionType
    readonly createdAt: string;
    readonly trailers: string;

    @Type(() => InspectionConfig)
    readonly inspectionConfig: InspectionConfig;
    @Type(() => Vehicle)
    readonly vehicle: Vehicle;
    @Type(() => Driver)
    readonly driver: Driver;

    @Type(() => Answer)
    readonly answers: Answer[];

    readonly place: string;
    @Type(() => Point)
    readonly point: Point;

    constructor() { }

    getAnswer(answerId: string) {
        if (!this.answers || this.answers.length === 0) {
            return null;
        }
        return this.answers.find(function (answer) {
            return answer.id === answerId;
        });
    }

    getNum() {
        return this.inspectionNum || "(unspecified)";
    }

    isSafe() {
        return this.safe ? "YES" : "NO";
    }
}

export class OdometerAdjustment {
    readonly id: string;
    readonly vehicleId: string;
    readonly odometer: number;
    readonly offset: number;
    readonly datetime: string;
    readonly reason: string;

    constructor() { }
}

export class ReportingProfileHistory {
    readonly id: string;
    readonly startedAt: string;
    readonly endedAt: string;
    @Type(() => ReportingProfile)
    readonly reportingProfile: ReportingProfile;

    constructor() { }
}

export const MINIMUM_WAGE_PRODUCT_TYPE = "Minimum_Wage_Compliance";
export const MILEAGE_PRODUCT_TYPE = "Mileage_Compliance";
export const DEVICE_PRODUCT_TYPE = "Device_Compliance";
export const NAVIGATION_PRODUCT_TYPE = "Navigation_Product";
export const DISPATCHING_PRODUCT_TYPE = "Dispatching_Product";

export class ReportType {
    readonly productType: string;
    readonly reportNames: string[];

    constructor(productType: string, reportNames: string[]) {
        this.productType = productType;
        this.reportNames = reportNames;
    }
}

export class ReportEntity {
    readonly belongsTo: string;
    readonly entityId: string;
    readonly entityType: string;
    readonly name: string;
    readonly status: string;

    constructor() { }
}

export class EntityThirdParty {
    readonly id: string;
    readonly identifier: string;
    readonly name: string;
    readonly periodWeekEnd: string;
    readonly vehicleCount: number;

    constructor() { }
}

export class ReportingProfile extends Reportable {
    readonly name: string;
    readonly entityName: string;
    readonly entityIdentifier: string;
    readonly countVehicles: number;
    readonly countDevices: number;
    readonly countDrivers: number;
    readonly reportPeriodEnd: string;
    readonly reportTimeZone: string;
    readonly defaultProfile: boolean;
    readonly units: string;
    @Type(() => Subscription)
    readonly subscriptions: Subscription[];
    @Type(() => LocationGroup)
    readonly locationGroups: LocationGroup[];
    @Type(() => ConnectionBind)
    readonly connectionBindList: ConnectionBind[];
    readonly allowThirdPartyAccess: boolean;

    constructor() {
        super();
    }

    private getSubscription(productType: string): Subscription {
        if (!this.subscriptions || this.subscriptions.length === 0) {
            return null;
        }
        let result = this.subscriptions.find(function (subscription) {
            return subscription.active() && subscription.productType === productType;
        });
        return result;
    }

    getMinimumWageSubscription(): Subscription {
        return this.getSubscription(MINIMUM_WAGE_PRODUCT_TYPE);
    }

    getMileageSubscription(): Subscription {
        return this.getSubscription(MILEAGE_PRODUCT_TYPE);
    }

    getDeviceSubscription(): Subscription {
        return this.getSubscription(DEVICE_PRODUCT_TYPE);
    }

    getNavigationSubscription(): Subscription {
        return this.getSubscription(NAVIGATION_PRODUCT_TYPE);
    }

    getDispatchingSubscription(): Subscription {
        return this.getSubscription(DISPATCHING_PRODUCT_TYPE);
    }

    activeSubscriptions(): Subscription[] {
        if (!this.subscriptions || this.subscriptions.length === 0) {
            return [];
        }
        return this.subscriptions.filter(
            subscription => subscription.active());
    }

    activeSubscriptionsOf(type: EntityType): Subscription[] {
        let activeSubscriptions = this.activeSubscriptions();
        return activeSubscriptions.filter(
            subscription => type === subscription.billingUnit);
    }

    getEstimationDate(): string {
        let activeSubscriptions: Subscription[] = this.activeSubscriptions();
        if (!activeSubscriptions || activeSubscriptions.length === 0) {
            return null;
        }
        let pickOneWithDate = activeSubscriptions.find(function (subscription: Subscription) {
            let createdAt = subscription.lastQuantity && subscription.lastQuantity.createdAt;
            return !!createdAt;
        });
        return pickOneWithDate.lastQuantity.createdAt;
    }

    activeSubscriptionTypes(): string[] {
        return this.activeSubscriptions().map(function (next: Subscription) {
            return next.productType;
        })
    }

    hasActiveSubscription(): boolean {
        if (!this.subscriptions || this.subscriptions.length === 0) {
            return false;
        }
        let result = this.subscriptions.find(function (subscription) {
            return subscription.active();
        });
        return !!result;
    }

    totalAmount(): number {
        if (!this.subscriptions || this.subscriptions.length === 0) {
            return 0;
        }
        let result = 0;
        this.subscriptions.forEach(function (subscription) {
            let totalAmount = 0;
            if (subscription && subscription.active() && subscription.lastQuantity) {
                totalAmount = subscription.lastQuantity.totalAmount();
            }
            result += totalAmount;
        });
        return result;
    }
}

export class Report {
    readonly reportName: string;
    readonly productType: string;
    @Type(() => ReportLinks)
    readonly links: ReportLinks;
    @Type(() => ReportPeriod)
    readonly reportPeriod: ReportPeriod;

    constructor() { }
}

export class ReportLinks {
    readonly JSON: string;
    readonly PDF: string;
    readonly EXCEL: string;
    readonly ARCHIVE: string;

    constructor() { }
}

export class ReportPeriod {
    readonly startedAt: string;
    readonly endedAt: string;
    readonly reportPeriodType: string; // Week, Calendar_Month, etc.
    readonly complete: boolean;

    constructor() { }
}

export class Subscription {
    readonly id: string;
    readonly productType: string;
    readonly unsubscribedAt: string;
    readonly billingUnit: string;
    @Type(() => QuantityEstimation)
    readonly lastQuantity: QuantityEstimation;
    readonly settings: any;

    constructor() { }

    active(): boolean {
        return !this.unsubscribedAt;
    }
}

export class QuantityEstimation {
    readonly id: string;
    readonly quantity: number;
    readonly amount: number;
    readonly createdAt: string;

    constructor() { }

    totalAmount() {
        if (!this.quantity || !this.amount) {
            return 0;
        }
        return this.quantity * this.amount;
    }
}

export class Connection {
    readonly id;
    readonly name: string;
    readonly type: string;
    readonly lastSync: string;
    readonly enabled: boolean;
    @Type(() => Auth)
    readonly auth: Auth;
    readonly error: boolean;
    readonly allowedCapabilities: string[];

    @Type(() => Company)
    readonly company: Company;

    constructor() { }

    status(): string {
        return this.enabled ? "(enabled)" : "(disabled)";
    }
}

export class ConnectionType {
    readonly type: string;
    readonly description: string;
    readonly auth: string[];
    readonly capabilities: string[];

    constructor() { }

    initAuth(): any {
        if (!this.auth || this.auth.length === 0) {
            return {};
        }
        let result = {};
        this.auth.forEach(function (field) {
            result[field] = "";
        });
        return result;
    }
}

export class LocalTime {
    readonly timezone: string;
    readonly UTCOffset: number;
    readonly localTime: string;
    readonly timezoneAbbreviation: string;

    constructor() { }
}

export class Auth {
    readonly companyId: string;
    readonly username: string;
    readonly password: string;

    constructor() { }
}

export class Operation {
    readonly id: string;
    readonly entityId: string;
    readonly operation: string;
    readonly finishedAt: string;
    readonly durationSeconds: number;
    readonly error: boolean;
    readonly errorReason: string;
    readonly errorMessage: string;

    constructor() { }

    status(): string {
        return this.error ? this.errorReason : "Success";
    }
}

export class ConnectionIssue {
    readonly id: string;
    readonly createdAt: string;
    readonly message: string;
    readonly objectId: string;
    readonly objectType: string;
    readonly solvedAt: string;
    readonly solvedBy: string;

    constructor() { }
}

export class ConnectionBind {
    readonly id: string;
    readonly remoteId: string;
    @Type(() => Connection)
    readonly connection: Connection;
    readonly lastSyncAt: string;

    constructor() { }
}

export class Notification {
    readonly id: string;
    readonly notificationType: string;
    readonly acknowledgeable: boolean;
    readonly entityType: string;
    readonly entityId: string;

    readonly text: string;
    readonly createdAt: string;

    constructor() { }
}

export class SupportedEntity {
    readonly entityId: string;
    readonly entityType: string;
    readonly name: string;

    constructor() { }

    normalizeEntityType() {
        return this.entityType && this.entityType.split("\\").pop();
    }
}

export class NotificationType {
    readonly notificationType: string;

    @Type(() => SupportedEntity)
    readonly supportedEntities: SupportedEntity[];
    readonly supportedAttributes: string[];
    /**
     * Array of supported communications.
     * Example values: `Text_Message`, `Email`, `In_App`
     */
    readonly supportedCommunications: string[];

    constructor() { }
}

export class NotificationSettingsAttributes {
    readonly name: string;
    readonly value: string;

    constructor() { }
}

export class NotificationSettings {
    readonly id: string;
    readonly notificationType: string;

    readonly entity: any;
    readonly entityId: string;
    /**
     * Server-side entity type in the form `App\\Entity\\Company`.
     */
    readonly entityType: string;

    readonly communicationType: string;
    @Type(() => NotificationSettingsAttributes)
    attributes: NotificationSettingsAttributes[];
    readonly ccEmailList: string[];
    readonly createdAt: string;

    constructor() { }

    getAttributeValue(name: string) {
        if (!this.attributes || this.attributes.length == 0) {
            return null;
        }
        let attr = this.attributes.find(function (next) {
            return name === (next && next.name);
        });
        return attr && attr.value;
    }

    joinAttributes() {
        return this.attributes
            .map(attr => attr.value)
            .join(", ");
    }

    /**
     * Generic method to return entity name, i.e. for:
     *   1. `Company` - it will be `company.name`.
     *   2. `Connection` - it will be `connection.name`.
     *   3. `ReportingProfile` - it will be `company.name`.
     *   4. `Vehicle` - it will be `company.remoteId`.
     *   5. `Driver` - it will be `driver.firstName + ' ' + driver.lastName`.
     */
    getEntityName() {
        function getDriverName(entity: any) {
            if (!entity.firstName && !entity.lastName) {
                return null;
            }
            let first: string = entity.firstName || "";
            let last: string = entity.lastName || "";
            return `${first} ${last}`;
        }

        return this.entity && (this.entity.name || getDriverName(this.entity) || this.entity.remoteId || "");
    }
}

export class NotificationSettingsList {
    readonly list: NotificationSettings[];

    constructor(list: NotificationSettings[]) {
        this.list = list;
        // Lets sort createdAt.ASC
        this.list.sort((a, b) => {
            if (a.createdAt < b.createdAt)
                return -1;
            if (a.createdAt > b.createdAt)
                return 1;
            return 0;
        });;
    }

    /**
     * Prepares UI hierarchy of the next format:
     * [
     *   {
     *     "notificationType": "Invoice_Paid",
     *     "typeMap": [
     *       {
     *         "entityName": "Company Name",
     *         "entityType": "App\Entity\Company",
     *         "entityId": "11111111-2222-3333-4444-555555555555",
     *         "settings": [...]
     *       },
     *       ...
     *     ]
     *   },
     *   ...
     * ]
     */
    prepareUIHierarchy(nsTypes: NotificationType[]) {
        var groupBy = function (xarray, key) {
            return xarray.reduce(function (rv, x) {
                (rv[x[key]] = rv[x[key]] || []).push(x);
                return rv;
            }, {});
        };

        this.list.forEach(function (ns: NotificationSettings) {
            // Lets reorder `ns.attributes` based on the type description
            let theType = nsTypes.find(function (next) {
                return ns.notificationType === next.notificationType;
            });
            let orderedAttributes = [];
            if (theType.supportedAttributes && theType.supportedAttributes.length > 0) {
                theType.supportedAttributes.forEach(function (name) {
                    let theAttribute = ns.attributes.find(function (next) {
                        return next.name === name;
                    });
                    orderedAttributes.push(theAttribute);
                });
            }
            ns.attributes = orderedAttributes;
        });

        let groupedByType = groupBy(this.list, 'notificationType');
        let result = [];
        // result will have order same to the `nsTypes` in terms of `notificationType`
        nsTypes.forEach(function (type) {
            const notificationType = type.notificationType;
            let ofType = groupedByType[notificationType];

            if (ofType && ofType.length > 0) {
                let entityMapList = [];
                let groupedByEntitiId = groupBy(ofType, 'entityId');
                // Prepare intermidiate map for each entity
                Object.keys(groupedByEntitiId).forEach(entitiId => {
                    let settings = groupedByEntitiId[entitiId];
                    let entityMap = {
                        entityName: settings[0].getEntityName(),
                        entityType: settings[0].entityType,
                        entityId: settings[0].entityId,
                        settings: settings
                    };

                    entityMapList.push(entityMap);
                })
                result.push({
                    notificationType: notificationType,
                    typeMap: entityMapList
                });
            }
        });
        return result;
    }
}

export class NotificationSending {
    readonly id: string;
    readonly subject: string;
    readonly sendingMethod: string;
    readonly body: string;
    readonly createdAt: string;

    @Type(() => User)
    readonly user: User;
    @Type(() => Notification)
    readonly notification: Notification;
    @Type(() => NotificationSettings)
    readonly notificationSetting: NotificationSettings;

    constructor() { }
}

export class SearchResult {
    readonly entityType: string;
    readonly entityId: string;
    readonly search: string;
    readonly status: string;
    readonly companyId: string;

    constructor() { }
}

export class DisplayEvent {
    readonly display: string;
    readonly event: any;

    constructor(display: string, event: any) {
        this.display = display;
        this.event = event;
    }
}

/**
 * There are some helper dynamic fields returned here too, they currently are not used:
 * `stopId`, `locationId`, `faults`, etc.
 */
export class EventContext {
    readonly description: string;

    constructor() { }
}

export class Event {
    readonly id: string;
    readonly event: string; // one of RestService.getVehicleEventsType(), RestService.getDriverEventsType(), RestService.getDeviceEventsType()
    readonly datetime: string;

    @Type(() => EventContext)
    readonly context: EventContext;
    @Type(() => Point)
    readonly point: Point;
    readonly textualLocation: string;
    readonly createdAt: string;

    constructor() { }

    getDescriptionPart() {
        return this.context && this.context.description && ` - ${this.context.description}` || "";
    }
}

export class PageResult<T> {

    @Exclude()
    private type: Function;

    @Type(options => {
        return (options.newObject as PageResult<T>).type;
    })
    results: T[];

    resultCount: number;

    constructor(type: Function) {
        this.type = type;
    }
}

export class FilterParams {
    readonly page: number;
    readonly sort: string;

    constructor(page: number, sort: string) {
        this.page = page;
        this.sort = sort;
    }
}

export interface ColumnSelector {
    index: number,
    name: string,
    visible: boolean
}

export class ColumnSelectorUtil {
    public static allColumnsVisible(names: string[]) {
        return names.map(function (theName: string, theIndex: number) {
            return {
                index: theIndex,
                name: theName,
                visible: true
            };
        });
    }

    public static applyProperties(names: string[], propertiesList) {
        return names.map(function (columnName: string, theIndex: number) {
            const properties = propertiesList && propertiesList.find(next => next.index === theIndex);
            return {
                index: theIndex,
                name: columnName,
                visible: !!properties ? properties.visible : true
            };
        });
    }
}

export class VehicleUtilization {
    readonly beginPositionId: string;
    readonly driverId: string;
    readonly endPositionId: string;
    readonly endedAt: string;
    readonly id: string;
    readonly startedAt: string;
    readonly vehicleId: string;

    constructor() { }
}

export class VehicleOption {
    readonly remote_id: string;
    readonly status: string;
    readonly vehicle_id: string;

    constructor() { }
}

export class DriverOption {
    readonly driver_id: string;
    readonly remote_id: string;
    readonly first_name: string;
    readonly last_name: string;
    readonly status: string;

    name(): string {
        let first: string = this.first_name || "";
        let last: string = this.last_name || "";
        return `${first} ${last}`;
    }

    constructor() { }
}

export class FilterIssues {
    issueNum: string;
    issueSourceType: string;
    issueStatus: string;
    vehicleId: string;
    workOrderId: string;
}

export class VehicleParts {
    reportingProfile: boolean;
    type: boolean;
    dispatchGroup: boolean;
}

export class FilterLocations {
    name: string;
}

export class FilterVehicles {
    reportingProfileId: string;
    connectionId: string;
    domicileLocationId: string;
    dispatchGroupId: string;
    remoteId: string;
    category: string;
}

export class FilterVehiclesThirdParty {
    reportingProfileId: string;
    domicileLocationId: string;
    remoteId: string;
    status: string; // one of Status
}

export class FilterDrivers {
    reportingProfileId: string;
    connectionId: string;
    dispatchGroupId: string;
}

export class FilterUsers {
    nameLike: string;
    companyId: string;
    role: string;
}

export class DriverStatuses {
    readonly accountId: number
    readonly assetId: number
    readonly availableBreak: string;
    readonly availableCycle: string;
    readonly availableDrive: string;
    readonly availableShift: string;
    readonly engineHours: string;
    readonly eventTime: string;
    readonly eventType: string;
    readonly fuelLevel: number
    readonly gainTimeHowMuch: string;
    readonly gainTimeHowMuchNextDay: string;
    readonly gainTimeWhen: string;
    readonly gainTimeWhich: string;
    readonly gpsSource: string;
    readonly heading: number
    readonly id: number
    readonly lastChangedDate: string;
    readonly latitude: number
    readonly location: string;
    readonly longitude: number
    readonly mobileOSVersion: string;
    readonly name: string;
    readonly odometerKm: number
    readonly pendingEditRequests: number
    readonly softwareVersion: string;
    readonly speedKm: number
    readonly speedKph: number
    readonly subsetId: number
    readonly uncertifiedLogs: number
    readonly userId: number
    readonly vbusConnected: boolean
    readonly vehiclePowerOn: boolean
}

export class DriversMetaNames {
    readonly active: boolean;
    readonly alias: string;
    readonly cycleCa: string;
    readonly cycleCan: string;
    readonly cycleMex: string;
    readonly cycleUsa: string;
    readonly email: string;
    readonly firstName: string;
    readonly id: number
    readonly lastName: string;
    readonly region: string;
    readonly subsetId: number
    readonly suffix: string;

    getCurrentRuleset() {
        let currentRule = this.cycleUsa;
        const region = this.region;
        if (region) {
            if (region === "USA") {
                currentRule = this.cycleUsa;
            } else if (region === "Canada") {
                currentRule = this.cycleCan ? this.cycleCan : this.cycleCa;
            } else if (region === "Mexico") {
                currentRule = this.cycleMex;
            }
        }
        return currentRule;
    }
}

export class FilterDevices {
    status: string;
    deviceType: string;
    operationalStatus: string;
    selectedVehicle: string;
    iccid: string;
    serialNumber: string;
    imei: string;
    softwareVersion: string;
}

export class ScheduledDashboardItem {
    readonly remoteId: string;
    readonly id: string;
    @Type(() => ScheduledMaintenanceItem)
    readonly scheduledMaintenanceItems: ScheduledMaintenanceItem[];

    remainingForSort?: number;

    constructor() { }
}

export class ScheduledMaintenanceItem {
    readonly id: string;
    readonly createdAt: string;
    readonly currentValueOf: number;
    readonly initialValue: number;
    readonly initialValueDateTime: string;
    readonly lastUpdate: string;

    @Type(() => MaintenanceIssue)
    readonly issue: MaintenanceIssue;
    @Type(() => MaintenanceItem)
    readonly scheduledMaintenanceItem: MaintenanceItem;

    backgroundColor?: string;
    remaining?: number;

    constructor() { }
}

export class LinehaulTrip {
    readonly id: string;
    readonly amountPackages: number;
    readonly amountRate: number;
    readonly date: string;
    @Type(() => DomicileLocation)
    readonly destinationLocation: DomicileLocation;
    readonly dropAndHook: number;
    readonly entityId: string;
    @Type(() => Driver)
    readonly firstDriver: Driver;
    readonly firstDriverRemoteId: string;
    readonly flatRate: number;
    readonly fuelRate: number;
    readonly legDestination: string;
    readonly legOrigin: string;
    readonly mileagePlusRate: number;
    readonly milesQty: number;
    @Type(() => DomicileLocation)
    readonly originLocation: DomicileLocation;
    readonly packages: number;
    readonly premiumsRate: number;
    @Type(() => Driver)
    readonly secondDriver: Driver;
    readonly secondDriverReportId: string;
    readonly tolls: number;
    readonly totalRate: number;
    readonly tripNum: string;
    @Type(() => Vehicle)
    readonly vehicle: Vehicle;
    readonly vehicleRemoteId: string;
    readonly vmrRate: number;
    readonly zip: string;

    constructor() { }
}
