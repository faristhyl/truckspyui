import {
  Component,
  ViewChild,
  Input,
  AfterViewInit,
  ElementRef,
  ViewEncapsulation,
} from '@angular/core';
import * as moment from 'moment';
//noinspection TypeScriptUnresolvedFunction
const $script = require('scriptjs');

declare var d3: any;
let timeOut = [],
  total = [],
  circlePlot = null,
  eventsPlot = null,
  chartGrid = null,
  chartTop = null,
  chartLeft = null,
  chartRight = null,
  chartBottomRight = null,
  strokeWidth = 3,
  millisPerHour = 3600000,
  millisPerDay = 86400000;

function clearTimeOuts() {
  const timeOutLen = timeOut.length;

  for (let i = 0; i < timeOutLen; i += 1) {
    clearTimeout(timeOut[i]);
  }

  timeOut = [];
}

enum ExceptionEvent {
  ADDED_EXCEPTION_REMARK = 'AddedExceptionRemark',
  REMOVED_EXCEPTION_REMARK = 'RemovedExceptionRemark'
}

@Component({
  selector: 'app-gridchart',
  template: '<div #gridchart style="width:100%;"></div>',
  encapsulation: ViewEncapsulation.None,
})
export class GridChartComponent implements AfterViewInit {
  @ViewChild('gridchart') private chartContainer: ElementRef;
  @Input() entity: any;
  @Input() selDate: any;
  @Input() logsChartApi: {  // methods of LogsChartComponent
    checkDriverDetailsExceptionsExist$: Function
  };
  container: any;
  private margin: any = { top: 20, bottom: 20, left: 0, right: 0 };
  width: any = 480;
  height: any = 72;
  zoom: any = 110;
  startTimeOfDay: any = 0;
  topLabels() {
    const chartTopLabels = [
      'M',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      'N',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      'M',
    ];
    const begin = this.beginTime;
    const end = this.endTime;
    const hoursCount = this.hoursCount();

    if (hoursCount > 24) {
      chartTopLabels.splice(2, 0, 'DST');
    } else if (hoursCount < 24) {
      chartTopLabels.splice(2, 1);
    }

    return chartTopLabels;
  }
  leftLabels = [
    {
      shortName: 'OF',
      status: 'OffDuty',
    },
    {
      shortName: 'SB',
      status: 'Sleeper',
    },
    {
      shortName: 'DR',
      status: 'Driving',
    },
    {
      shortName: 'ON',
      status: 'OnDuty',
    },
  ];
  beginTime = moment(moment(this.selDate).format('YYYY-MM-DD'));
  endTime = moment(moment(this.selDate).format('YYYY-MM-DD')).add(1, 'day');
  leftHandleTs = moment();
  rightHandleTs = moment();
  lastStatus = null;
  data = [];
  lastDuty: any = null;
  hasDaily: any = true;
  viewChartEvents: any = true;
  isShowHandles = false;
  eventType: any = null;
  agricultureSpan = [];
  personalUseSpan = [];
  yardMovesSpan = [];
  autoDrivingSpan = [];
  eldDisconnectionSpan = [];
  exception = [];

  readonly excludeDriveTimeColor = '#808080'; // change line color on this one after ExcludeDriveTime Event

  hoursCount() {
    const begin = this.beginTime;
    const end = begin.clone().add(1, 'days');

    return moment.duration(end.diff(begin)).asHours();
  }
  svg: any;
  g: any;

  color: any;

  private initialized = false;

  constructor(private el: ElementRef) { }

  ngAfterViewInit() {
    $script(['https://d3js.org/d3.v4.min.js', 'https://d3js.org/topojson.v1.min.js'], () => {
      this.d3Init();
    });
    
  }
  ngOnChanges() {
    if (this.chartContainer) {
      this.redraw();
    }
  }

  d3Init() {
    this.hasDaily = true;
    this.data = this.entity;
    this.create();
    this.draw();
    this.initialized = true;
  }
  /**
   * Returns a formatted string of the calculated event time durations.
   *
   * @param  {string} status Driving event status
   * @return {string} Formatted string of time duration
   */
  getTextFormattedDuration(status) {
    let total = this.entity.totalStatus;
    const ms = !total[status] || !this.viewChartEvents ? 0 : total[status],
      duration = moment.duration(ms),
      hours = Math.floor(duration.asHours()),
      minutes =
        moment.duration(ms).seconds() >= 30
          ? moment.duration(ms).add(1, 'minute').minutes()
          : moment.duration(ms).minutes(),
      formatHours = hours < 10 ? `0${hours}` : hours,
      formatMinutes = minutes < 10 ? `0${minutes}` : minutes;

    return `${formatHours}:${formatMinutes}`;
  }
  /**
   * Measures the exact position of the grid labels
   * @param  {string} text A certain grid label name
   * @param  {string} font A certain font-name
   * @return {number}      The measured distance in each grid labels
   */
  measureText(text) {
    let _font = '12px arial',
      o = $('<div>' + text.toLowerCase() + '</div>')
        .css({
          position: 'absolute',
          float: 'left',
          'white-space': 'nowrap',
          visibility: 'hidden',
          font: _font,
        })
        .appendTo($('body')),
      w = o.width();

    o.remove();

    return w;
  }
  /**
   * Calculates time duration of a certain event
   * @param  {String} statusBeginTime The begin time of driving
   * @param  {String} statusEndTime   The end time of driving
   * @param  {String} status          Type of driving event
   * @return {Void}
   */
  calculateDurations({
    statusBeginTime,
    statusEndTime,
    status,
    hasYardMoves,
    hasPersonalUse
  }) {
    let _this = this,
      _statusBeginTime = _this.roundDownToMinute(moment(statusBeginTime)),
      _statusEndTime = _this.roundDownToMinute(moment(statusEndTime)),
      ms = 0;

    if (!_statusBeginTime.isAfter(_this.beginTime)) {
      _statusBeginTime = _this.beginTime;
    }
    ms = moment.duration(ms).asMilliseconds();
    total[status] = isNaN(total[status]) ? ms : (total[status] + ms);
    total["all"] = isNaN(total["all"]) ? ms : (total["all"] + ms);
  }
  create() {
    let element = this.chartContainer.nativeElement;
    d3.selectAll('svg').remove();

    const el = d3
      .select(element)
      .append('svg')
      .attr("viewBox", `0 0 550 120`)

    // Grid layout
    chartGrid = el.append('g').attr('id', 'grid').attr('transform', 'translate(30, 17)');

    // Top corner of the chart
    chartTop = el
      .append('g')
      .attr('id', 'hour-markings')
      .attr('transform', 'translate(26, 13)')
      .style('fill', '#585858')
      .style('stroke-width', '0.4')
    // Left corner of the chart
    chartLeft = el
      .append('g')
      .attr('id', 'status-markings')
      .attr('transform', 'translate(0, 31)')
      .style('fill', '#585858')
      .style('stroke-width', '0.4');

    // Right corner of the chart
    chartRight = el
      .append('g')
      .attr('id', 'durations')
      .attr('transform', 'translate(515, 31)')
      .style('fill', '#585858')
      .style('stroke-width', '0.4');

    // Bottom right corner of the chart
    chartBottomRight = el
      .append('g')
      .attr('id', 'totalDurations')
      .attr('transform', 'translate(515, 31)')
      .style('fill', '#585858')
      .style('stroke-width', '0.4');

    // Events plot
    eventsPlot = el.append('g').attr('id', 'statusPlot').attr('transform', 'translate(30, 17)');

    // Circle plot
    circlePlot = el.append('g').attr('id', 'circlePlot').attr('transform', 'translate(30, 17)');

    // Start draw the logs gridchart widget
    this.draw();
  }
  /**
   * Returns a date-time with a rounded minute.
   * @param {object} ts date-time.
   * @return {object} date-time
   */
  roundDownToMinute(ts) {
    let timestamp = ts.clone();
    return timestamp.startOf("minute");
  }
  /**
   * A coordinates helper of Y-Access
   * @param  {string} duty Driving event type
   * @return {string} The height of a vertical line
   */
  yHelper(duty) {
    const _this = this;
    let height = 0,
      chartHeight = _this.height;

    const hasOilFieldOperations = _this.exception.includes("OilFieldOperations");

    // The default chart height settings that will be overriden in the below statement
    // when `OilServiceFieldException` is being used.
    switch (duty) {
      case "OffDuty":
        height = chartHeight * 0.125;
        break;
      case "Sleeper":
        height = chartHeight * 0.125 + chartHeight * 0.25;
        break;
      case "Driving":
        height = chartHeight * 0.125 + chartHeight * 0.50;
        break;
      case "OnDuty":
        height = chartHeight * 0.125 + chartHeight * 0.75;
        break;
    }

    // Setup the height of the additional (W) row when `OilServiceFieldException` is being used.
    if (hasOilFieldOperations) {
      switch (duty) {
        case "OffDuty":
          height = chartHeight * 0.1;
          break;
        case "Sleeper":
          height = chartHeight * 0.1 + chartHeight * 0.2;
          break;
        case "Driving":
          height = chartHeight * 0.1 + chartHeight * 0.4;
          break;
        case "OnDuty":
          height = chartHeight * 0.1 + chartHeight * 0.6;
          break;
        case "WaitingAtSite":
          height = chartHeight * 0.1 + chartHeight * 0.8;
          break;
      }
    }

    return height;
  }

  /**
   * A coordinates helper of X-Access
   * @param  {string} duty The date and time of a certain driving event occurs
   * @return {number} The width of a horizontal line
   */
  xHelper(dateTime) {
    const _this = this,
      hoursCount = this.hoursCount(),
      chartWidth = _this.width;

    if (dateTime.isBefore(_this.beginTime)) {
      dateTime = _this.beginTime;
    }

    if (dateTime.isAfter(_this.endTime)) {
      dateTime = _this.endTime;
    }

    const _millisPerDay = hoursCount * millisPerHour;

    return chartWidth * dateTime.diff(_this.beginTime) / _millisPerDay;
  }
  /**
       * Shows the span of time of a certain driving event above the horizontal line
       * @param  {[type]} t0   [description]
       * @param  {[type]} t1   [description]
       * @param  {[type]} status [description]
       * @return {[type]}      [description]
       */
  showTimeAboveSegment(beginTime, endTime, status) {
    let _t0 = this.roundDownToMinute(beginTime),
      _t1 = this.roundDownToMinute(endTime);

    // Put hours above horizontal segment
    if (_t0.isBefore(this.beginTime)) {
      _t0 = this.beginTime;
    }

    if (!_t1 || !_t1.isBefore(this.endTime)) {
      _t1 = this.endTime;
    }

    const width = this.xHelper(_t1) - this.xHelper(_t0);
    const ms = _t1.diff(_t0);

    const hours = Math.floor(moment.duration(ms).hours()),
      minutes = moment.duration(ms).minutes(),
      formatedMinutes = (minutes < 10) ? `0${minutes}` : minutes,
      formatedHours = (hours < 10) ? hours : hours,
      text = `${formatedHours}:${formatedMinutes}`;

    // Exclude this from displaying
    if (text === "0:00") {
      return false;
    }

    // Only draw if it fits
    if ((this.measureText(text) - 10) < width) {
      let x = (this.xHelper(_t0) + this.xHelper(_t1)) / 2 - this.measureText(text) / 2,
        y = this.yHelper(status);

      eventsPlot.append("text")
        .attr("class", "timeIndicator")
        .attr("y", y - 2)
        .attr("x", x + 7)
        .text(text)
        .style("font-size", "9px")
        .style("fill", "#0c69ff")
        .style("font-weight", "bold")
        .style("font-family", "'Roboto', Helvetica, Arial, sans-serif");
    }
  }
  /**
   * Drawing a remark segment.
   *
   * @param {object} data
   */
  drawRemarkSeg() {

    const strokeWidth = 1.5;

    this.entity && this.entity.exceptions && this.entity.exceptions.forEach(element => {
      const color = element.eventType === 'Remark' ? '#616161' :
        element.eventType === 'hour34ExceptionTime' ? "blue" : "none";

      if (element.type === 'Horz') {
        this.drawHorizontalStatusLines(element.beginTime, element.endTime, element.beginEvent, color, strokeWidth, false, false);
      } else if (element.type === 'Vert') {
        this.drawVerticalStatusLines(element.beginEvent, element.endEvent, element.beginTime, color, strokeWidth, element.eldStatus);
      }
    });
  }
  drawChartTopLabels() {
    const _this = this,
      hoursCount = this.hoursCount();

    const loopTopLabels = function (index) {
      if (index <= hoursCount) {
        const indexOfLabel = (index + _this.startTimeOfDay) % hoursCount;
        const label = _this.topLabels()[indexOfLabel];
        const x = (index * _this.width) / hoursCount;

        chartTop
          .append('text')
          .attr('y', 0)
          .attr('x', x - _this.measureText(label) / 2 + 4)
          .text(label);

        index += 1;
        timeOut.push(
          setTimeout(function () {
            loopTopLabels(index);
          }, 0)
        );
      }
    };

    loopTopLabels(0);
  }


  drawChartGrids() {
    const _this = this,
      hoursCount = this.hoursCount(),
      leftLabelsLen = this.leftLabels.length;

    let loopHorizontalLines, loopGridTicks;
    const loopChartGrids = function (chartGridsIndex) {
      if (chartGridsIndex < hoursCount) {
        if (chartGridsIndex < hoursCount) {
          // Calculates the distance of each vertical lines
          let x = (chartGridsIndex * _this.width) / hoursCount,
            // The vertical line wrapper
            columns = chartGrid.append('g').attr('transform', 'translate(' + x + ', 0)').attr('class', 'column');

          // The vertical line itself
          columns
            .append('line')
            .attr('x2', 0)
            .attr('y1', 0)
            .attr('x1', 0)
            .attr('y2', _this.height)
            .style('fill', 'transparent')
            .style('stroke', '#b8b8b8')
            .style('stroke-width', '1');

          // The three small vertical lines
          loopGridTicks = function (gridTicksIndex) {
            if (gridTicksIndex < leftLabelsLen) {
              let y = (gridTicksIndex * _this.height) / leftLabelsLen,
                row = columns.append('g').attr('transform', 'translate(0, ' + y + ')');

              // Grid ticks for OF and SB rows
              if (gridTicksIndex < 2) {
                row
                  .append('line')
                  .attr('y2', 5)
                  .attr('x2', 5)
                  .attr('y1', 0)
                  .attr('x1', 5)
                  .style('fill', 'transparent')
                  .style('stroke', '#b8b8b8')
                  .style('stroke-width', '1');

                row
                  .append('line')
                  .attr('y2', 10)
                  .attr('x2', 10)
                  .attr('y1', 0)
                  .attr('x1', 10)
                  .style('fill', 'transparent')
                  .style('stroke', '#b8b8b8')
                  .style('stroke-width', '1');

                row
                  .append('line')
                  .attr('y2', 5)
                  .attr('x2', 15)
                  .attr('y1', 0)
                  .attr('x1', 15)
                  .style('fill', 'transparent')
                  .style('stroke', '#b8b8b8')
                  .style('stroke-width', '1');
              } else {
                // Grid ticks for DR and ON rows
                row
                  .append('line')
                  .attr('y2', 18)
                  .attr('x2', 5)
                  .attr('y1', 13)
                  .attr('x1', 5)
                  .style('fill', 'transparent')
                  .style('stroke', '#b8b8b8')
                  .style('stroke-width', '1');

                row
                  .append('line')
                  .attr('y2', 18)
                  .attr('x2', 10)
                  .attr('y1', 8)
                  .attr('x1', 10)
                  .style('fill', 'transparent')
                  .style('stroke', '#b8b8b8')
                  .style('stroke-width', '1');

                row
                  .append('line')
                  .attr('y2', 18)
                  .attr('x2', 15)
                  .attr('y1', 13)
                  .attr('x1', 15)
                  .style('fill', 'transparent')
                  .style('stroke', '#b8b8b8')
                  .style('stroke-width', '1');
              }

              gridTicksIndex += 1;
              timeOut.push(loopGridTicks(gridTicksIndex));
            }
          };

          loopGridTicks(0);
        }

        chartGridsIndex += 1;

        timeOut.push(
          setTimeout(function () {
            loopChartGrids(chartGridsIndex);
          }, 0)
        );
      } else {
        loopHorizontalLines = function (horizontalLinesIndex) {
          if (horizontalLinesIndex < leftLabelsLen) {
            let y = (horizontalLinesIndex * _this.height) / leftLabelsLen;

            chartGrid
              .append('line')
              .attr('x1', 0)
              .attr('y2', y)
              .attr('x2', _this.width)
              .attr('y1', y)
              .style('fill', 'transparent')
              .style('stroke', '#b8b8b8')
              .style('stroke-width', '1');

            horizontalLinesIndex += 1;

            timeOut.push(
              setTimeout(function () {
                loopHorizontalLines(horizontalLinesIndex);
              }, 0)
            );
          } else {
            chartGrid
              .append('rect')
              .attr('y', 0)
              .attr('x', 0)
              .attr('height', _this.height)
              .attr('width', _this.width)
              .style('fill', 'transparent')
              .style('stroke', '#b8b8b8')
              .style('stroke-width', '1');
          }
        };

        loopHorizontalLines(1);

        // temporary turned off filling background of rects - task https://github.com/truckspy/truckspyui/issues/598
        // _this.fillBackgroundRect();

      }
    };
    
    loopChartGrids(0);
  }
  drawChartLeft() {
    let _this = this,
      leftLabelsLen = _this.leftLabels.length,
      loopLeftLabels;

    loopLeftLabels = function (index) {
      if (index < leftLabelsLen) {
        let label = _this.leftLabels[index],
          y = (index * _this.height) / leftLabelsLen,
          classAttr;

        switch (label.shortName) {
          case 'OF':
            classAttr = 'off';
            break;
          case 'SB':
            classAttr = 'sleeper';
            break;
          case 'DR':
            classAttr = 'drive';
            break;
          case 'ON':
            classAttr = 'on';
            break;
          case 'WT':
            classAttr = 'waiting';
            break;
        }

        chartLeft
          .append('text')
          .attr('y', y)
          .attr('x', 0)
          .attr('class', classAttr)
          .text(label.shortName)
          .style('font-size', '11px')
          .style('fill', '#727272')
          .style('font-family', "'Roboto', Helvetica, Arial, sans-serif");

        index += 1;
        timeOut.push(
          setTimeout(function () {
            loopLeftLabels(index);
          }, 0)
        );
      }
    };

    loopLeftLabels(0);
  }
  drawChartRight() {
    let _this = this,
      leftLabelsLen,
      loopDurations;

    if (chartRight && chartBottomRight) {
      leftLabelsLen = _this.leftLabels.length;

      chartRight.selectAll('*').remove();
      chartBottomRight.selectAll('*').remove();

      loopDurations = function (durationsIndex) {
        var y = (durationsIndex * _this.height) / leftLabelsLen,
          formattedDuration;

        if (durationsIndex < leftLabelsLen) {
          formattedDuration = _this.getTextFormattedDuration(_this.leftLabels[durationsIndex].status);
          chartRight.append('text').attr('y', y).attr('x', 0).text(formattedDuration);

          durationsIndex += 1;
          timeOut.push(
            setTimeout(function () {
              loopDurations(durationsIndex);
            }, 0)
          );
        } else {
          formattedDuration = _this.getTextFormattedDuration('all');
          chartBottomRight
            .append('line')
            .attr('x1', 0)
            .attr('y2', y - 13)
            .attr('x2', 28)
            .attr('y1', y - 13)
            .style('fill', 'transparent')
            .style('stroke', '#b8b8b8')
            .style('stroke-width', '1');

          chartBottomRight
            .append('text')
            .attr('y', y)
            .attr('x', 0)
            .text(formattedDuration)
            .style('font-size', '11px')
            .style('fill', '#727272')
            .style('font-family', "'Roboto', Helvetica, Arial, sans-serif");
        }
      };

      loopDurations(0);
    }
  }

  getXPoint(time) {
    const hoursCount = this.hoursCount();
    const chartWidth = this.width;

    if (time.isBefore(this.beginTime)) {
      time = this.beginTime;
    }

    if (time.isAfter(this.endTime)) {
      time = this.endTime;
    }

    const _millisPerDay = hoursCount * millisPerHour;
    return chartWidth * time.diff(this.beginTime) / _millisPerDay;
  }
  getYPoint(status) {
    let height = 0;
    let chartHeight = this.height;

    // The default chart height settings that will be overriden in the below statement
    // when `OilServiceFieldException` is being used.
    switch (status) {
      case "OffDuty":
        height = chartHeight * 0.125 + chartHeight * 0;
        break;
      case "Sleeper":
        height = chartHeight * 0.125 + chartHeight * 0.25;
        break;
      case "Driving":
        height = chartHeight * 0.125 + chartHeight * 0.50;
        break;
      case "OnDuty":
        height = chartHeight * 0.125 + chartHeight * 0.75;
        break;
      case "Remark":
        height = chartHeight * 0 + chartHeight * 1;
        break;
    }
    return height;
  }
  drawHorizontalStatusLines(statusBeginTime, statusEndTime, status, color, strokeWidth, driverEdit, showTime, excludeDriveEventTime = null) {

    let _statusEndTime = statusEndTime;
    let _statusBeginTime = statusBeginTime;

    if (!statusBeginTime || statusBeginTime.isBefore(this.beginTime)) {
      _statusBeginTime = this.beginTime;
    }

    if (!statusEndTime || statusEndTime.isAfter(this.endTime)) {
      _statusEndTime = this.endTime;
    }

    let yPos = this.getYPoint(status);
    let x0 = this.getXPoint(_statusBeginTime);
    let x1 = this.getXPoint(_statusEndTime);

    // if excludeDriveEventTime exist we create divideX to divide line on two parts with different colors
    // else if divideX == 0 we change x0 to it and change color to gray
    let divideX = excludeDriveEventTime ? this.getXPoint(excludeDriveEventTime) : null;
    if (divideX || divideX===0) console.log(x0, x1, 'divideX => ', divideX);

    if (driverEdit) {
      eventsPlot.append("polyline")
        .attr("class", `events ${color}`)
        // if divideX exists and !==0 - add first part of line, otherwise create full line 
        .attr("points", `${divideX === 0 ? divideX : x0}, ${yPos} ${divideX ? divideX : x1}, ${yPos}`)
        .attr("stroke-dasharray", strokeWidth)
        .style("stroke", '#FF8F00')
        .style("fill", "none")
        .style("stroke-width", strokeWidth)
        .style("opacity", 1);
    } else {
      eventsPlot.append("polyline")
        .attr("class", `events ${color}`)
        // if divideX exists and !==0 - add first part of line, otherwise create full line 
        .attr("points", `${divideX === 0 ? divideX : x0}, ${yPos} ${divideX ? divideX : x1}, ${yPos}`)
        .style("stroke", divideX === 0 ? this.excludeDriveTimeColor : color)
        .style("fill", "none")
        .style("stroke-width", divideX === 0 ? 1.5 : strokeWidth)
        .style("opacity", 1);
    }
    // add second part of line if divideX exists
    if (divideX) {
      eventsPlot.append("polyline")
        .attr("class", `events ${this.excludeDriveTimeColor}`)
        .attr("points", `${divideX}, ${yPos} ${x1}, ${yPos}`)
        .style("stroke", this.excludeDriveTimeColor)
        .style("fill", "none")
        .style("stroke-width", 1.5)
        .style("opacity", 1);
    }
    if (showTime)
      this.showTimeAboveSegment(_statusBeginTime, _statusEndTime, status);
  }
  drawVerticalStatusLines(statusBeginEvent, statusEndEvent, eventTime, color, strokeWidth, eldStatus) {

    let _statusBeginTime = eventTime;

    if (!eventTime || eventTime.isBefore(this.beginTime)) {
      _statusBeginTime = this.beginTime;
    }

    let xPos = this.getXPoint(_statusBeginTime);
    let y0 = statusBeginEvent ? this.getYPoint(statusBeginEvent) : 0;
    let y1 = statusEndEvent ? this.getYPoint(statusEndEvent) : this.height;

    eventsPlot.append("polyline")
      .attr("class", `events ${color}`)
      .attr("points", `${xPos}, ${y0} ${xPos}, ${y1}`)
      .style("stroke", color)
      .style("fill", "none")
      .style("stroke-width", strokeWidth)
      .style("opacity", 1);

    if (eldStatus !== "none") {
      if (eldStatus == "Connected") {
        circlePlot.append("circle")
          .attr("cx", xPos)
          .attr("cy", y0)
          .attr("r", 1.5)
          .style("fill", "#143E43");
      } else if (eldStatus == "Disconnected") {
        circlePlot.append("circle")
          .attr("cx", xPos)
          .attr("cy", y0)
          .attr("r", 1.5)
          .style("fill", "#FFFFFF")
          .style("stroke", "#143E43");
      }
    }
  }

  drawChartEventStatus() {
    const color = "#5ABA57";
    const strokeWidth = 3;
    this.entity && this.entity.eventStatus && this.entity.eventStatus.forEach((element, index) => {
      let excludeDriveEventStartDateTime = null;
      // set time of excludeDriveEvent if conditions is true and send it to the functions below 'drawHorizontalStatusLines' and 'drawVerticalStatusLines'
      this.entity.excludeDriveTimeEvents.forEach((excludeDriveTimeEvent) => {
        if (excludeDriveEventStartDateTime === null) {
          if (element.beginTime < excludeDriveTimeEvent.eventTime && element.endTime > excludeDriveTimeEvent.eventTime) {
            excludeDriveEventStartDateTime = excludeDriveTimeEvent.eventTime
          } else if (element.beginTime >= excludeDriveTimeEvent.eventTime && index === 0) {
            excludeDriveEventStartDateTime = excludeDriveTimeEvent.eventTime
          } else {
            excludeDriveEventStartDateTime = null;
          }
        }
      });

      if (element.type === 'Horz') {
        this.drawHorizontalStatusLines(
          element.beginTime,
          element.endTime,
          element.beginEvent,
          color,
          strokeWidth,
          element.driverEdit,
          element.showTime,
          excludeDriveEventStartDateTime
        );
      } else if (element.type === 'Vert') {
        const vertLineColor = excludeDriveEventStartDateTime ? this.excludeDriveTimeColor : color;
        this.drawVerticalStatusLines(element.beginEvent, element.endEvent, element.beginTime, vertLineColor, strokeWidth, "none");
      }
    });
  }

  drawChartViolations() {
    const color = "	#FF0000";
    const strokeWidth = 3;

    this.entity && this.entity.allViolations && this.entity.allViolations.forEach(element => {
      if (element.type === 'Horz') {
        this.drawHorizontalStatusLines(element.beginTime, element.endTime, element.beginEvent, color, strokeWidth, element.driverEdit, element.showTime);
      } else if (element.type === 'Vert') {
        this.drawVerticalStatusLines(element.beginEvent, element.endEvent, element.beginTime, color, strokeWidth, "none");
      }
    });
  }

  draw() {
    clearTimeOuts();

    if (chartTop) {
      this.drawChartTopLabels();
      this.drawChartGrids();
      this.drawChartLeft();
      this.drawChartRight();
      this.drawChartEventStatus();
      this.drawRemarkSeg();
      this.drawChartViolations();

    }
  }

  redraw() {
    if (typeof d3 !== 'undefined') {
      this.beginTime = moment(moment(this.selDate).format('YYYY-MM-DD'));
      this.endTime = moment(moment(this.selDate).format('YYYY-MM-DD')).add(1, 'day');
      d3.selectAll('svg').remove();
      this.create();
      this.draw();
    }
  }

  async fillBackgroundRect() {
      // default width for column
      const defaultWidth = 20;
      // all columns
      const hours = d3.selectAll('.column').nodes().slice(1);
      // history for current date
      const selectedDateHistory = this.entity.histories.filter(history => {
        return moment(history.eventTime).format('YYYY-MM-DD') === moment(this.selDate).format('YYYY-MM-DD');
      });

      // divided history on hours
      const driverLogs = selectedDateHistory.reduce((acc, history) => {
        const hour = moment(history.eventTime).hour();
        if (!acc[hour]) acc[hour] = [];

        acc[hour].push(history);
        return acc;
      }, {});

      // check existing of exceptions
      let isException = this.entity.isExceptions;
      let isLastRemoveRemark = !isException;

      if (!isException) {
        // check previous date exceptions
        const previousDateExceptions = await this.checkPreviousDays(this.selDate);
        if (previousDateExceptions[previousDateExceptions.length-1].eventType ===  ExceptionEvent.ADDED_EXCEPTION_REMARK) {
          isException = true;
        }
      }

      for(let i = 0; i < 24; i++) {
        const logEntries = driverLogs[i];
        const addHistory = logEntries ? logEntries.find(x => x.eventType === ExceptionEvent.ADDED_EXCEPTION_REMARK) : null;
        const removeHistory = logEntries ? logEntries.find(x => x.eventType === ExceptionEvent.REMOVED_EXCEPTION_REMARK) : null;

        if (addHistory) {
          isException = true;
        }

        let rectWidth = defaultWidth;
        let x = 1;
        let rectBackgroundFill = 'transparent';

        if (isException) {
          // change size of rects
          if (removeHistory) {
            rectWidth = Math.round(defaultWidth * moment(removeHistory.eventTime).minute()/60 );
            isException = false;
            isLastRemoveRemark = true;
          }
          if (addHistory && isLastRemoveRemark) {
            x = Math.round( defaultWidth * moment(addHistory.eventTime).minute() /60 );
            rectWidth = defaultWidth - x + 2;
            isLastRemoveRemark = false;
          }
          rectBackgroundFill = 'lightblue';
        }

        // add rect
        d3.select(hours[i])
          .insert('rect', ':first-child')
          .attr('class', 'background-rect')
          .attr('y1', 0)
          .attr('x', x)
          .attr('height', '72')
          .attr('width', rectWidth)
          .style('fill', rectBackgroundFill);
      }
  }

  private async checkPreviousDays(date) {
    const momentPreviousDate = moment(date).subtract(1, "days").format('YYYY-MM-DD');
    // get history for previous date
    const previousDateHistory = this.entity.histories.filter(history => {
      return moment(history.eventTime).format('YYYY-MM-DD') === momentPreviousDate;
    });
    // get all the exceptions of previousDateHistory
    const previousDateExceptions = previousDateHistory.filter(historyItem => {
      return historyItem.eventType === ExceptionEvent.ADDED_EXCEPTION_REMARK || historyItem.eventType === ExceptionEvent.REMOVED_EXCEPTION_REMARK
    });
    // check existing of exceptions for driver detail
    const isException = await this.logsChartApi.checkDriverDetailsExceptionsExist$(momentPreviousDate).toPromise();
    if (previousDateExceptions.length > 0 || isException) {
      // return exceptions if they exist
      if (isException) { return [{ eventType: ExceptionEvent.ADDED_EXCEPTION_REMARK}, ...previousDateExceptions]; }
      return previousDateExceptions;
    } else {
      // return check the day before current one if they don't exist
      return await this.checkPreviousDays(momentPreviousDate);
    }
  }

}