import React from "react";
import gql from "graphql-tag";
import { Query } from "react-apollo";
import Head from "next/head";
import Link from "next/link";
import { perPage } from "../config";
import PaginationStyles from "./styles/PaginationStyles";

const PAGINATION_QUERY = gql`
  query PAGINATION_QUERY {
    itemsConnection {
      aggregate {
        count
      }
    }
  }
`;

const Pagination = props => (
  <Query query={PAGINATION_QUERY}>
    {({ data, loading, error }) => {
      if (loading) return <p>loading</p>;
      const count = data.itemsConnection.aggregate.count;
      const pages = Math.ceil(count / perPage);
      const page = props.page;

      return (
        <PaginationStyles>
          <Head>
            <title>
              Sick Fits! - {page} of {pages}
            </title>
          </Head>

          <Link
            prefetch
            href={{ pathname: "items", query: { page: page - 1 } }}
          >
            <a className="prev" aria-disabled={page <= 1}>
              prev
            </a>
          </Link>
          <p>
            Page {props.page} of {pages}
          </p>
          <p>{count} items total</p>
          <Link
            prefetch
            href={{ pathname: "items", query: { page: page + 1 } }}
          >
            <a className="prev" aria-disabled={page >= pages}>
              next
            </a>
          </Link>
        </PaginationStyles>
      );
    }}
  </Query>
);

export default Pagination;
