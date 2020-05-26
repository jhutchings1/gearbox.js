import React from 'react';
import { MockCogniteClient } from "../../../mocks";
import { pick } from "lodash";
import { assetsList, timeseriesListV2, fakeEvents, fakeFiles } from '../../../mocks';
import { ClientSDKProvider } from "../../..";
import { AssetSearchFilter } from "@cognite/sdk";

class CogniteClient extends MockCogniteClient {
  assets: any = {
    search: (query: AssetSearchFilter) => {
      if (query.search && query.search.name === 'empty') {
        return Promise.resolve([]);
      }

      if (query.search && query.search.name === 'error') {
        Promise.reject(new Error('sdk search request failed'));
      }

      return new Promise((resolve) => {
        setTimeout(() => resolve(assetsList), 1000);
      });
    },
  };
  timeseries: any = {
    search: () => {
      return Promise.resolve(timeseriesListV2);
    }
  };
  files: any = {
    search: () => {
      return Promise.resolve(fakeFiles);
    }
  };
  events: any = {
    search: () => {
      return Promise.resolve(fakeEvents);
    }
  };
}

const client = new CogniteClient({ appId: 'gearbox test' });

export const decorators = [
  (storyFn: any) => (
    <ClientSDKProvider client={client}>{storyFn()}</ClientSDKProvider>
  ),
];

export const heightProp = '400px';
