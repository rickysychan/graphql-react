import React, { Component } from "react";
import Downshift, { resetIdCounter } from "downshift";
import Router from "next/router";
import { ApolloConsumer } from "react-apollo";
import gql from "graphql-tag";
//debounce bunches up events that happen under a certain amount of time and sends them at once so you don't ddos your own servers
import debounce from "lodash.debounce";
import { DropDown, DropDownItem, SearchStyles } from "./styles/DropDown";

const SEARCH_ITEMS_QUERY = gql`
  query SEARCH_ITEMS_QUERY($searchTerm: String!) {
    items(
      where: {
        OR: [
          { title_contains: $searchTerm }
          { description_contains: $searchTerm }
        ]
      }
    ) {
      id
      image
      title
    }
  }
`;

function routeToItem(item) {
  Router.push({
    pathname: "/item",
    query: {
      id: item.id
    }
  });
}

// AppolloConsumer is used over the usual method of wrapping content in a query because we need to make a
// query on demand not on load

export default class AutoComplete extends Component {
  state = {
    items: [],
    loading: false
  };

  //debounce takes two arguments, the function and how long the time span for bunching stuff up should be
  onChange = debounce(async (e, client) => {
    console.log("searching...");
    //turn loading ON
    this.setState({
      loading: true
    });
    //manually query apollo client
    const res = await client.query({
      query: SEARCH_ITEMS_QUERY,
      variables: { searchTerm: e.target.value }
    });
    this.setState({ items: res.data.items, loading: false });
  }, 350);

  render() {
    // used to get rid of label warning from downshift caused by dowshift incrementing label id on render persisting
    resetIdCounter();
    return (
      // itemToString is used so that when clicking enter on a drop down object, the input doesn't become [Object object]
      <SearchStyles>
        <Downshift
          onChange={routeToItem}
          itemToString={item => (item === null ? "" : item.title)}
        >
          {({
            getInputProps,
            getItemProps,
            isOpen,
            inputValue,
            highlightedIndex
          }) => (
            <div>
              <ApolloConsumer>
                {client => (
                  //we use getInputProps so that a user clicks on a drop down item, it just autofill the search bar
                  <input
                    {...getInputProps({
                      type: "Search",
                      placeholder: "search for an item",
                      id: "search",
                      className: this.state.loading ? "loading" : "",
                      onChange: e => {
                        // we need to use persist because we are using debounce on an event which is nullified before debounce can use it
                        e.persist();
                        this.onChange(e, client);
                      }
                    })}
                  />
                )}
              </ApolloConsumer>
              {// added isOpen checks so that if the user clicks the escape key the drop down exits
              // passing in the index in map allows for the user to click down and access items in the drop down
              isOpen && (
                <DropDown>
                  {this.state.items.map((item, index) => (
                    <DropDownItem
                      {...getItemProps({ item })}
                      key={item.id}
                      highlighted={index === highlightedIndex}
                    >
                      <img width="50" src={item.image} alt={item.title} />
                      {item.title}
                    </DropDownItem>
                  ))}
                </DropDown>
              )}
              {!this.state.items.length && !this.state.loading && (
                <DropDownItem>Nothing found for {inputValue}</DropDownItem>
              )}
            </div>
          )}
        </Downshift>
      </SearchStyles>
    );
  }
}
