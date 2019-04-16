import { Button, Icon, Input, Modal } from 'antd';
import { debounce } from 'lodash';
import React, { SyntheticEvent } from 'react';
import styled from 'styled-components';
import { Asset } from '@cognite/sdk';
import { AssetSearchForm } from '../AssetSearchForm/AssetSearchForm';
import { RootAssetSelect } from '../RootAssetSelect/RootAssetSelect';
import {
  PureObject,
  AdvancedAssetSearch,
  ApiQuery,
  OnAssetSearchResult,
  OnAssetSearch,
  IdCallback,
  EmptyCallback,
} from '../../interfaces';

const { Search } = Input;

const InputGroup = styled(Input.Group)`
  display: flex !important;
  flex-grow: 1;
`;

const ButtonBlock = styled(Button)`
  width: 100%;
`;
const RootAssetSelectStyled = styled(RootAssetSelect)`
  width: 35%;
`;

export const defaultStrings: PureObject = {
  changeSearch: 'Change search',
  clear: 'Clear',
  searchPlaceholder: 'Search for an asset',
  search: 'Search',
};

export interface AssetSearchProps {
  fetchingLimit: number;
  debounceTime: number;
  boostName: boolean;
  rootAssetSelect: boolean;
  advancedSearch: boolean;
  strings: PureObject;
  assets: Asset[];
  assetId?: number;
  onSearchResults?: OnAssetSearchResult;
  onSearch?: OnAssetSearch;
  onAssetSelected?: IdCallback;
  onFilterIconClick?: EmptyCallback;
}

export interface AssetSearchState {
  assetId: number;
  query: string;
  isModalOpen: boolean;
  advancedSearchQuery: AdvancedAssetSearch | null;
}

export class AssetSearch extends React.Component<
  AssetSearchProps,
  AssetSearchState
> {
  static defaultProps = {
    assets: [],
    fetchingLimit: 25,
    debounceTime: 200,
    boostName: true,
    advancedSearch: false,
    rootAssetSelect: false,
    strings: {},
  };

  onSearch = debounce(this.debouncedSearch.bind(this), this.props.debounceTime);

  constructor(props: AssetSearchProps) {
    super(props);
    this.state = {
      assetId: props.assetId || 0,
      query: '',
      isModalOpen: false,
      advancedSearchQuery: null,
    };
  }

  debouncedSearch() {
    const { onSearch, boostName, fetchingLimit, onSearchResults } = this.props;
    const { query, advancedSearchQuery, assetId } = this.state;
    const assetSubtrees = assetId ? [assetId] : null;

    const apiQuery: ApiQuery = {
      advancedSearch: advancedSearchQuery,
      fetchingLimit,
      assetSubtrees,
      boostName,
      query,
    };

    if (!query && !advancedSearchQuery && onSearchResults) {
      onSearchResults(null, apiQuery);

      return;
    }

    if (onSearch) {
      onSearch(apiQuery);
    }
  }

  onFilterIconClick = () => {
    const { onFilterIconClick } = this.props;

    if (onFilterIconClick) {
      onFilterIconClick();
    }

    this.setState({
      isModalOpen: true,
    });
  };

  onModalCancel = () => {
    const { onSearchResults } = this.props;

    this.setState({
      advancedSearchQuery: null,
      isModalOpen: false,
      query: '',
    });

    if (onSearchResults) {
      onSearchResults(null);
    }
  };

  onModalOk = () => {
    this.setState({ isModalOpen: false }, this.onSearch);
  };

  onAssetSelected = (assetId: number) => {
    const { onAssetSelected } = this.props;

    if (onAssetSelected) {
      onAssetSelected(assetId);
    }

    this.setState({ assetId }, this.onSearch);
  };

  onAssetSearchChange = (value: AdvancedAssetSearch) =>
    this.setState({ advancedSearchQuery: value, query: '' });

  onSearchQueryInput = (e: SyntheticEvent) => {
    const target = e.target as HTMLInputElement;
    this.setState({ query: target.value }, this.onSearch);
  };

  render() {
    const { assetId, query, isModalOpen, advancedSearchQuery } = this.state;
    const { assets, strings, advancedSearch, rootAssetSelect } = this.props;
    const lang = { ...defaultStrings, ...strings };
    const { changeSearch, clear, searchPlaceholder, search } = lang;

    return (
      <React.Fragment>
        <InputGroup compact={true}>
          {rootAssetSelect && (
            <RootAssetSelectStyled
              onAssetSelected={this.onAssetSelected}
              assets={assets}
              assetId={assetId}
            />
          )}
          {advancedSearchQuery ? (
            <React.Fragment>
              <ButtonBlock type="primary" onClick={this.onFilterIconClick}>
                {changeSearch}
              </ButtonBlock>
              <Button htmlType="button" onClick={this.onModalCancel}>
                {clear}
              </Button>
            </React.Fragment>
          ) : advancedSearch ? (
            <Input
              placeholder={searchPlaceholder as string}
              disabled={!!advancedSearchQuery}
              value={query}
              onChange={this.onSearchQueryInput}
              allowClear={true}
              suffix={
                <Icon
                  type="filter"
                  onClick={this.onFilterIconClick}
                  style={{ opacity: 0.6, marginLeft: 8 }}
                />
              }
            />
          ) : (
            <Search
              placeholder={searchPlaceholder as string}
              disabled={!!advancedSearchQuery}
              value={query}
              onChange={this.onSearchQueryInput}
              allowClear={true}
            />
          )}
        </InputGroup>
        <Modal
          visible={isModalOpen}
          onCancel={this.onModalCancel}
          footer={[
            <Button htmlType="button" key="cancel" onClick={this.onModalCancel}>
              {clear}
            </Button>,
            <Button
              htmlType="button"
              key="search"
              type="primary"
              onClick={this.onModalOk}
            >
              {search}
            </Button>,
          ]}
        >
          <AssetSearchForm
            value={advancedSearchQuery}
            onPressEnter={this.onModalOk}
            onChange={this.onAssetSearchChange}
          />
        </Modal>
      </React.Fragment>
    );
  }
}
