import { CogniteClient, Asset, FilesMetadata, CogniteEvent } from "@cognite/sdk";
import { TimeSeries } from "@cognite/sdk/dist/src/resources/classes/timeSeries";
import _ from 'lodash';

export type SearchResource =
  | AssetWithDiscriminator
  | EventWithDiscrimnator
  | TimeseriesWithDiscrimnator
  | FileWithDiscrimnator;

type AssetWithDiscriminator = Asset & {
  resourceType: 'asset';
};

type TimeseriesWithDiscrimnator = TimeSeries & {
  resourceType: 'timeSeries';
};

type FileWithDiscrimnator = FilesMetadata & {
  resourceType: 'file';
};

type EventWithDiscrimnator = CogniteEvent & {
  resourceType: 'event';
};

// Unsafe since it mutates the items of the array, to prevent unnecessary copies & method rebinds
function unsafeWithDiscriminator<T>(l: T[], discriminator: string): SearchResource[] {
  l.forEach(x => {
    (x as any).resourceType = discriminator;
  });
  return l as unknown as SearchResource[];
}

export type SearchForFilter = {
  assets: boolean,
  events: boolean,
  files: boolean,
  timeSeries: boolean,
};

const defaultSearchFor: SearchForFilter = {
  assets: true,
  events: true,
  files: true,
  timeSeries: true
};

export function globalSearch(client: CogniteClient, query: string, searchFor: Partial<SearchForFilter> = {}): Promise<SearchResource[]> {
  const { assets, events, files, timeSeries } = { ...defaultSearchFor, ...searchFor };

  const resolveEmptyIfFalse = <T>(flag: boolean, f: () => Promise<T[]>) => {
    if (flag) {
      return f();
    } else {
      return Promise.resolve([]);
    }
  };

  const searchForAssets = () => client.assets.search({
    search: {
      query
    }
  }).then(l => unsafeWithDiscriminator(l, 'asset'));

  const searchForTimeSeries = () => client.timeseries.search({
    search: {
      query
    }
  }).then(l => unsafeWithDiscriminator(l, 'timeSeries'));

  const searchForEvents = () => client.events.search({
    search: {
      description: query
    }
  }).then(l => unsafeWithDiscriminator(l, 'event'))

  const searchForFiles = () => client.files.search({
    search: {
      name: query
    }
  }).then(l => unsafeWithDiscriminator(l, 'file'))

  return Promise.all([
    resolveEmptyIfFalse(assets, searchForAssets),
    resolveEmptyIfFalse(timeSeries, searchForTimeSeries),
    resolveEmptyIfFalse(files, searchForFiles),
    resolveEmptyIfFalse(events, searchForEvents),
  ]).then(l => _.flatten(l));
}
