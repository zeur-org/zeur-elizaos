import { Plugin } from '@elizaos/core';
import { PositionManagerAction } from '../actions/position-manager.js';
import { DataFetcherAction } from '../actions/data-fetcher.js';
import { YieldAnalyticsAction } from '../actions/yield-analytics.js';
import { OptimizationEngineAction } from '../actions/optimization-engine.js';
import { RebalanceExecutorAction } from '../actions/rebalance-executor.js';
import { MonitoringAction } from '../actions/monitoring.js';
import { PositionManagerEvaluator } from '../evaluators/position-manager-evaluator.js';
import { YieldAnalyticsEvaluator } from '../evaluators/yield-analytics-evaluator.js';
import { RiskAssessmentEvaluator } from '../evaluators/risk-assessment-evaluator.js';
import { GasOptimizationProvider } from '../providers/gas-optimization-provider.js';
import { ProtocolDataProvider } from '../providers/protocol-data-provider.js';
import { PerformanceAnalyticsProvider } from '../providers/performance-analytics-provider.js';

export const ZeurPlugin: Plugin = {
    name: 'zeur-yield-optimizer',
    description: 'Advanced DeFi yield optimization and position management plugin for Zeur Protocol',
    actions: [
        PositionManagerAction,
        DataFetcherAction,
        YieldAnalyticsAction,
        OptimizationEngineAction,
        RebalanceExecutorAction,
        MonitoringAction
    ],
    evaluators: [
        PositionManagerEvaluator,
        YieldAnalyticsEvaluator,
        RiskAssessmentEvaluator
    ],
    providers: [
        GasOptimizationProvider,
        ProtocolDataProvider,
        PerformanceAnalyticsProvider
    ]
}; 