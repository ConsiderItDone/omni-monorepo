/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ChartTransfers
// ====================================================

export interface ChartTransfers_transfersChartData {
  __typename: 'TransferChartData';
  date: any;
  amount: number | null;
  quantity: number | null;
}

export interface ChartTransfers {
  transfersChartData: ChartTransfers_transfersChartData[];
}
