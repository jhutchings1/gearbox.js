import React, { useContext, useCallback, useState } from 'react';
import { ClientSDKContext } from '../../context/clientSDKContext';
import { globalSearch, SearchResource, SearchForFilter } from './globalSearch';
import { Search } from '../common/Search/Search';
import { PureObject } from '../..';
import _ from 'lodash';
import styled from 'styled-components';
import { Icon } from 'antd';
import { withDefaultTheme } from '../../hoc';

type GlobalSearchStrings = {
  assets: string,
  timeseries: string,
  events: string,
  files: string,
  noDescription: string
};

const defaultStrings: GlobalSearchStrings = {
  assets: 'Assets',
  timeseries: 'Timeseries',
  events: 'Events',
  files: 'Files',
  noDescription: "[No Description]",
};

type RenderSearchItem = (strings: GlobalSearchStrings, item: SearchResource) => React.ReactNode;

type GlobalSearchProps = {
  onError?: (error: any) => void;
  searchForFilter?: SearchForFilter;
  strings?: Partial<GlobalSearchStrings>;
  renderSearchResult?: (
    strings: GlobalSearchStrings,
    searchForFilter: SearchForFilter,
    items: SearchResource[],
    renderSearchItem: RenderSearchItem
  ) => React.ReactNode;
  renderSearchItem?: RenderSearchItem;
};

function titleFromResource(strings: GlobalSearchStrings, resource: SearchResource) {
  switch(resource.resourceType) {
    case "asset": return resource.name;
    case "timeSeries": return resource.name;
    case "event": return (resource.description || strings.noDescription);
    case "file": return resource.name;
    default: return "N/A";
  }
}

function iconFromResource(resource: SearchResource) {
  switch(resource.resourceType) {
    case "asset": return <Icon type="deployment-unit" />
    case "timeSeries": return <Icon type="line-chart" />;
    case "event": return <Icon type="alert" />;
    case "file": return <Icon type='file' />;
  }
}

function defaultRenderSearchItem(strings: GlobalSearchStrings, item: SearchResource) {
  const title = titleFromResource(strings, item);
  const icon = iconFromResource(item);
  return (
    <span key={item.id}>{icon} {title}</span>
  );
}

function defaultRenderSearchResult(
  strings: GlobalSearchStrings,
  searchForFilter: SearchForFilter,
  items: SearchResource[],
  renderSearchItem: RenderSearchItem
) {
  const renderHeaderIfTrue = (render: Boolean, header: string) => render ? <ResourceSectionHeader>{header.toUpperCase()}</ResourceSectionHeader> : null;
  const itemsGroupedByResourceType = _.groupBy(items, item => item.resourceType);
  const renderItemsIfExists = <T extends SearchResource>(items: T[] | undefined) =>
    <SearchResultList>
      {(items ?? []).map(item => (
        <SearchResultItem>
          {renderSearchItem(strings, item)}
          </SearchResultItem>
        )
      )}
    </SearchResultList>;

  return (
    <>
      {renderHeaderIfTrue(searchForFilter.assets, strings.assets)}
      {renderItemsIfExists(itemsGroupedByResourceType.asset)}
      {renderHeaderIfTrue(searchForFilter.timeSeries, strings.timeseries)}
      {renderItemsIfExists(itemsGroupedByResourceType.timeSeries)}
      {renderHeaderIfTrue(searchForFilter.events, strings.events)}
      {renderItemsIfExists(itemsGroupedByResourceType.event)}
      {renderHeaderIfTrue(searchForFilter.files, strings.files)}
      {renderItemsIfExists(itemsGroupedByResourceType.file)}
    </>
  );
}

export function GlobalSearch({
  strings: userStrings,
  searchForFilter: userSearchForFilter,
  onError,
  renderSearchResult: userRenderSearchResult,
  renderSearchItem: userRenderSearchItem
}: GlobalSearchProps) {
  const [searchResults, setSearchResults] = useState<SearchResource[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const client = useContext(ClientSDKContext);
  const strings = { ...defaultStrings, ...(userStrings ?? {}) };
  const searchForFilter = userSearchForFilter ?? {
    assets: true,
    events: true,
    timeSeries: true,
    files: true
  };

  const renderSearchResult = userRenderSearchResult ?? defaultRenderSearchResult;
  const renderSearchItem = userRenderSearchItem ?? defaultRenderSearchItem;

  const handleSearch = useCallback((searchQuery: string) => {
    if (client == null) {
      throw new Error('Remember to add a ClientSDKProvider before using any Gearbox components.');
    }
    setLoading(true);
    globalSearch(client, searchQuery, searchForFilter)
      .then(x => {
        setLoading(false);
        setSearchResults(x);
      })
      .catch(err => {
        if (onError) {
          onError(err);
        }
        setSearchResults([]);
      });
    return;
  }, [client]);

  return (
    <>
      <Search loading={loading} strings={strings as PureObject} onSearch={handleSearch} />
      {searchResults.length == 0 ? null : renderSearchResult(strings, searchForFilter, searchResults, renderSearchItem)}
    </>
  )
}

const ResourceSectionHeader = styled.h2`
  font-weight: 600;
`;

const SearchResultList = withDefaultTheme(styled.ul`
  list-style: none;
  padding-left: 0px;
`);

const SearchResultItem = styled.li`
  cursor: pointer;
  &:hover {
    background-color: ${({ theme }) => theme.gearbox.selectColor};
  }
`;
