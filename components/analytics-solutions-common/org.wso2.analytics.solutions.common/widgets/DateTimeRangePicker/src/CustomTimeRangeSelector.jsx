/* eslint-disable react/prop-types */
/*
 * Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import { MenuItem, SelectField, RaisedButton } from 'material-ui';
import DateTimePicker from './DateTimePicker';
import Moment from "moment";

export default class CustomTimeRangeSelector extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            inputType: this.getDefaultGranularity(),
            invalidDateRange: false
        };

        this.startTime = new Date();
        this.endTime = new Date();
        this.handleStartTimeChange = this.handleStartTimeChange.bind(this);
        this.handleEndTimeChange = this.handleEndTimeChange.bind(this);
        this.generateGranularityMenuItems = this.generateGranularityMenuItems.bind(this);
        this.getSelectedGranularities = this.getSelectedGranularities.bind(this);
        this.getDefaultGranularity = this.getDefaultGranularity.bind(this);
        this.publishCustomTimeRange = this.publishCustomTimeRange.bind(this);
    }


    getDefaultGranularity() {
        const { options } = this.props;
        const minGranularity = options.availableGranularities || 'From Second';
        let defaultGranularity = '';
        switch (minGranularity) {
            case 'From Second':
                defaultGranularity = 'second';
                break;
            case 'From Minute':
                defaultGranularity = 'minute';
                break;
            case 'From Hour':
                defaultGranularity = 'hour';
                break;
            case 'From Day':
                defaultGranularity = 'day';
                break;
            case 'From Month':
                defaultGranularity = 'month';
                break;
            case 'From Year':
                defaultGranularity = 'year';
                break;
            default:
            // do nothing
        }
        return defaultGranularity;
    }

    getSelectedGranularities() {
        const { options } = this.props;
        let granularities = [];
        const minGranularity = options.availableGranularities || 'From Second';
        switch (minGranularity) {
            case 'From Second':
                granularities = ['Second', 'Minute', 'Hour', 'Day', 'Month', 'Year'];
                break;
            case 'From Minute':
                granularities = ['Minute', 'Hour', 'Day', 'Month', 'Year'];
                break;
            case 'From Hour':
                granularities = ['Hour', 'Day', 'Month', 'Year'];
                break;
            case 'From Day':
                granularities = ['Day', 'Month', 'Year'];
                break;
            case 'From Month':
                granularities = ['Month', 'Year'];
                break;
            case 'From Year':
                granularities = ['Year'];
                break;
            default:
            // do nothing
        }
        return granularities;
    }

    handleStartTimeChange(date) {
        this.startTime = date;
        const start = Moment(this.startTime);
        const end = Moment(this.endTime);
        if(end.diff(start) < 0) {
            this.setState({ invalidDateRange: true });
        } else {
            this.setState({ invalidDateRange: false });
        }
    }

    handleEndTimeChange(date) {
        this.endTime = date;
        const start = Moment(this.startTime);
        const end = Moment(this.endTime);
        if(end.diff(start) < 0) {
            this.setState({ invalidDateRange: true });
        } else {
            this.setState({ invalidDateRange: false });
        }
    }

    generateGranularityMenuItems() {
        return (this.getSelectedGranularities()).map(view => {
            // 这里处理方式为添加一个viewTranMap 对象用于只汉化用户界面显示部分，不影响程序传值的逻辑判断
            const viewTranMap = { 'Second': '秒', 'Minute': '分钟', 'Hour': '小时', 'Day': '天', 'Month': '月', 'Year': '年' };
            return (
                <MenuItem
                    value={view.toLowerCase()}
                    primaryText={viewTranMap[view]}
                />
            )
            });
    }

    publishCustomTimeRange() {
        const { handleClose, onChangeCustom } = this.props;
        const { inputType } = this.state;
        handleClose();
        onChangeCustom('custom', this.startTime, this.endTime, inputType);
    }

    render() {
        const { inputType } = this.state;
        const { theme } = this.props;
        return (
            <div
                style={{ marginTop: 10 }}
            >
                <div
                    style={{ marginBottom: 10 }}
                >
                    每
                    <br />
                    <SelectField
                        className="perUnderline"
                        value={inputType}
                        onChange={(event, index, value) => {
                            this.setState({ inputType: value });
                        }}
                    >
                        {this.generateGranularityMenuItems()}
                    </SelectField>
                </div>
                <div style={{ display: 'flex'}}>
                    <div
                        style={{
                            width: '50%',
                            float: 'left',
                        }}
                    >
                        从
                        <br />
                        <DateTimePicker
                            onChange={this.handleStartTimeChange}
                            inputType={inputType}
                            theme={theme}
                        />
                    </div>
                    <div
                        style={{
                            width: '50%',
                            float: 'right',
                        }}
                    >
                        至
                        <br />
                        <DateTimePicker
                            onChange={this.handleEndTimeChange}
                            inputType={inputType}
                            theme={theme}
                        />
                    </div>
                </div>
                {this.state.invalidDateRange ? <div style={{color: '#dc3545', paddingTop: 10}}>
                    无效的日期范围，请重新选择。 </div> : ''}
                <RaisedButton
                    primary
                    style={{
                        marginTop: 10,
                        marginBottom: 10,
                        float: 'right',
                    }}
                    disabled={this.state.invalidDateRange}
                    onClick={this.publishCustomTimeRange}
                >
                    应用
                </RaisedButton>
            </div>
        );
    }
}
