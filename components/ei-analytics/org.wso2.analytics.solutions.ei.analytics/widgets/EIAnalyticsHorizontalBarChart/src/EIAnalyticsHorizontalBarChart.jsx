/*
 * Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import Widget from '@wso2-dashboards/widget';
import VizG from 'react-vizgrammar';
import moment from 'moment';

const BAR_GRAPH_TYPE = 'Component Type Selection';
const URL_PARAMETER_ID = 'id';
const DIV_ID_GRAPH = 'graph';
const PUBLISHER_DATE_TIME_PICKER = 'granularity';
const TENANT_ID = '-1234';

/**
 * Dashboard widget class for the EIAnalyticsHorizontalBarChart widget
 */
class EIAnalyticsHorizontalBarChart extends Widget {
    /**
     * Initialize graph parameters with the default values
     * @param props Props received from the dashboard
     */
    constructor(props) {
        super(props);
        const config = {
            'x': 'Name',
            charts: [
                {
                    type: 'bar',
                    y: 'Requests',
                    'fill': 'rgb(21, 101, 192)',
                    orientation: 'left'
                },
            ],
            legend: false,
            append: false,
            'disableVerticalGrid': true,
            'disableHorizontalGrid': true,
            'animate': true,
        };
        const metadata = {
            'names': [
                'Name',
                'Requests'
            ],
            types: [
                'ordinal',
                'linear'
            ],
        };
        this.state = {
            graphConfig: config,
            graphMetadata: metadata,
            graphData: null,
            graphWidth: props.width,
            graphHeight: props.height,
            graphType: props.configs.options[BAR_GRAPH_TYPE],
            isLoading: true,
            timeFromParameter: null,
            timeToParameter: null,
            timeUnitParameter: null,
            isRouteAtOnClick: false,
            redirectData: null,
        };
        this.props.glContainer.on('resize', () => {
                this.setState({
                    width: this.props.glContainer.width,
                    height: this.props.glContainer.height,
                });
            }
        );
        this.isConfLoadError = false;
        this.handlePublisherParameters = this.handlePublisherParameters.bind(this);
        this.handleGraphUpdate = this.handleGraphUpdate.bind(this);
        this.handleStats = this.handleStats.bind(this);
    }

    static getProviderConf(widgetConfiguration) {
        return widgetConfiguration.configs.providerConfig;
    }

    componentWillMount() {
        super.subscribe(this.handlePublisherParameters);
    }

    /**
     * Handle published messages from the subscribed widgets in the dashboard to extract required parameters
     *
     * @param message JSON object coming from the subscribed widgets
     */
    handlePublisherParameters(message) {
        if (PUBLISHER_DATE_TIME_PICKER in message) {
            this.setState({
                timeFromParameter: moment(message.from)
                    .format('YYYY-MM-DD HH:mm:ss'),
                timeToParameter: moment(message.to)
                    .format('YYYY-MM-DD HH:mm:ss'),
                timeUnitParameter: message.granularity,
                isLoading: true,
            }, this.handleGraphUpdate);
        }
    }

    /**
     * Update graph parameters according to the updated publisher widget parameters
     */
    handleGraphUpdate() {
        super.getWidgetConfiguration(this.props.widgetID)
            .then((message) => {
                this.isConfLoadError = false;
                /* Get data provider sub json string from the widget configuration. */
                const dataProviderConf = EIAnalyticsHorizontalBarChart.getProviderConf(message.data);
                let query = dataProviderConf.configs.config.queryData.query;
                const graphType = this.state.graphType;
                const aggregator = (
                    graphType === 'api' || graphType === 'proxy service' || graphType === 'inbound endpoint'
                ) ? 'ESBStatAgg' : 'MediatorStatAgg';
                /* Insert required parameters to the query string. */
                dataProviderConf.configs.config.queryData.query = query
                    .replace('{{aggregator}}', aggregator)
                    .replace('{{componentType}}', graphType)
                    .replace('{{tenantId}}', TENANT_ID)
                    .replace('{{timeFrom}}', this.state.timeFromParameter)
                    .replace('{{timeTo}}', this.state.timeToParameter);
                /* Request data-store with the modified query. */
                super.getWidgetChannelManager()
                    .subscribeWidget(
                        this.props.id,
                        this.handleStats,
                        dataProviderConf
                    );
            })
            .catch(() => {
                this.isConfLoadError = true;
            });
    }

    /**
     * Draw the graph with the data retrieved from the data store
     */
    handleStats(stats) {
        /* For each data point(Ex: For each API), an array of [total invocations, component name of that data point]. */
        const dataPointArray = stats.data;
        /* index and label mapping of each element in a data point. */
        const labelMapper = {};
        stats.metadata.names.forEach((value, index) => {
            labelMapper[value] = index;
        });
        /* Build data for the graph. */
        const data = [];
        dataPointArray.forEach((dataPoint) => {
            /* Filter well known components. */
            let excludeEndpoints;
            switch (this.state.graphType) {
                case 'endpoint':
                    excludeEndpoints = ['AnonymousEndpoint'];
                    break;
                case 'sequence':
                    excludeEndpoints = ['PROXY_INSEQ', 'PROXY_OUTSEQ', 'PROXY_FAULTSEQ', 'API_OUTSEQ', 'API_INSEQ',
                        'API_FAULTSEQ', 'AnonymousSequence', 'fault'];
                    break;
                default:
                    excludeEndpoints = [];
            }
            const componentName = dataPoint[labelMapper.componentName];
            const validity = excludeEndpoints.indexOf(componentName) === -1;
            if (validity) {
                data.push([
                    componentName,
                    dataPoint[labelMapper.totalInvocations],
                ],);
            }
        });
        /* Draw the graph with received stats only if data is present after filtering. */
        if (data.length > 0) {
            this.setState({
                graphData: data,
                isLoading: false,
            });
        }
    }

    /**
     * Return notification message when required parameters to draw the graph are not available
     *
     * @returns {*} <div> element containing the notification message
     */
    renderEmptyRecordsMessage() {
        return (
            <div className="status-message" style={{
                color: 'white',
                marginLeft: 'auto',
                marginRight: 'auto',
                padding: '5px 5px 5px 5px'
            }}>
                <div className="message message-info">
                    <h4>
                        <i class="icon fw fw-info"/> 没有数据</h4>
                    <p>
                        {
                            this.isConfLoadError ? '加载小部件配置文件时出错' :
                                '请选择一个有效的日期范围来查看统计信息。'
                        }
                    </p>
                </div>
            </div>
        );
    }

    handleGraphOnClick(message) {
        const clickedComponentName = message.Name;
        const urlString = window.location.pathname;
        let redirectPageName;
        switch (this.state.graphType) {
            case 'api':
                redirectPageName = 'api';
                break;
            case 'endpoint':
                redirectPageName = 'endpoint';
                break;
            case 'sequence':
                redirectPageName = 'sequence';
                break;
            case 'mediator':
                redirectPageName = 'mediator';
                break;
            case 'proxy service':
                redirectPageName = 'proxy';
                break;
            case 'inbound endpoint':
                redirectPageName = 'inbound';
                break;
            default:
                redirectPageName = '';
        }
        const formattedString = urlString.substring(0, urlString.lastIndexOf('/') + 1) + redirectPageName;
        let existingUrlHash = decodeURIComponent(window.location.hash);
        let hashComponent = existingUrlHash === "" ? {} : JSON.parse(existingUrlHash.substring(1));
        hashComponent[this.getKey(redirectPageName, URL_PARAMETER_ID)] = clickedComponentName;
        window.location.href = formattedString + ('#' + JSON.stringify(hashComponent));
    }

    /**
     * Draw the graph with parameters from the widget state
     *
     * @returns {*} A VizG graph component with the required graph
     */
    renderGraph() {
        return (
            <VizG
                theme={this.props.muiTheme.name}
                config={this.state.graphConfig}
                data={this.state.graphData}
                metadata={this.state.graphMetadata}
                onClick={this.handleGraphOnClick.bind(this)}
                height={this.props.glContainer.height}
                width={this.props.glContainer.width}
            />
        );
    }

    getKey(pageName, parameter) {
        return pageName + "_page_" + parameter;
    }

    render() {
        if (this.state.isRouteAtOnClick) {
            return (
                <BrowserRouter>
                    <Redirect to={this.state.redirectData}/>
                </BrowserRouter>
            );
        }
        return (
            <div id={DIV_ID_GRAPH}>
                {this.state.isLoading ? this.renderEmptyRecordsMessage() : this.renderGraph()}
            </div>
        );
    }
}

global.dashboard.registerWidget('EIAnalyticsHorizontalBarChart', EIAnalyticsHorizontalBarChart);
