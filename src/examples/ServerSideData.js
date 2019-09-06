import React, { useState, useEffect, useRef } from "react";
import makeData from "../makeData";
import { useTableState } from "../react-table";

import { Input } from "../components/Styles";
import Table from "../components/Table";

const serverData = makeData(10000);

// Simulate a server
const getServerData = async ({ filters, sortBy, pageSize, pageIndex }) => {
  await new Promise(resolve => setTimeout(resolve, 500));

  // Ideally, you would pass this info to the server, but we'll do it here for convenience
  const filtersArr = Object.entries(filters);

  // Get our base data
  let rows = serverData;

  // Apply Filters
  if (filtersArr.length) {
    rows = rows.filter(row =>
      filtersArr.every(([key, value]) => row[key].includes(value))
    );
  }

  // Apply Sorting
  if (sortBy.length) {
    const [{ id, desc }] = sortBy;
    rows = [...rows].sort(
      (a, b) => (a[id] > b[id] ? 1 : a[id] === b[id] ? 0 : -1) * (desc ? -1 : 1)
    );
  }

  // Get page counts
  const pageCount = Math.ceil(rows.length / pageSize);
  const rowStart = pageSize * pageIndex;
  const rowEnd = rowStart + pageSize;

  // Get the current page
  rows = rows.slice(rowStart, rowEnd);

  return {
    rows,
    pageCount
  };
};

const columns = [
  {
    Header: "All",
    columns: [
      {
        Header: "Name",
        columns: [
          {
            Header: "First Name",
            accessor: "firstName",
            minWidth: 140,
            maxWidth: 200,
            Filter: header => {
              return (
                <Input
                  placeholder='Search...  eg. "room"...'
                  value={header.filterValue || ""}
                  onChange={e => header.setFilter(e.target.value)}
                />
              );
            }
          },
          {
            Header: "Last Name",
            id: "lastName",
            accessor: d => d.lastName,
            minWidth: 140,
            maxWidth: 200
          }
        ]
      },
      {
        Header: "Info",
        columns: [
          {
            Header: "Age",
            accessor: "age",
            width: 100,
            aggregate: "average"
          },
          {
            Header: "Visits",
            accessor: "visits",
            width: 100,
            aggregate: "sum"
          },
          {
            Header: "Profile Progress",
            accessor: "progress",
            aggregate: "average",
            minWidth: 200,
            Cell: row => (
              <div
                style={{
                  width: `${row.value}%`,
                  minWidth: "5px",
                  height: "20px",
                  backgroundColor: `hsla(${row.value}, 100%, 45%, 1)`,
                  borderRadius: "2px",
                  transition: "all .4s ease"
                }}
              />
            )
          },
          {
            Header: "Status",
            accessor: "status",
            width: 150,
            Cell: row => (
              <span>
                <span
                  style={{
                    color:
                      row.value === "relationship"
                        ? "#ff2e00"
                        : row.value === "complicated"
                        ? "#ffbf00"
                        : "#57d500",
                    transition: "all .5s ease"
                  }}
                >
                  &#x25cf;
                </span>{" "}
                {row.value === "relationship"
                  ? "Relationship"
                  : row.value === "complicated"
                  ? `Complicated`
                  : "Single"}
              </span>
            )
          }
        ]
      }
    ]
  }
];

export default function({ infinite }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentRequestRef = useRef();

  // Make a new controllable table state instance
  const state = useTableState({ pageCount: 0 });

  const [{ sortBy, filters, pageIndex, pageSize }, setState] = state;

  const fetchData = async () => {
    setLoading(true);

    // We can use a ref to disregard any outdated requests
    const id = Date.now();
    currentRequestRef.current = id;

    // Call our server for the data
    const { rows, pageCount } = await getServerData({
      filters,
      sortBy,
      pageSize,
      pageIndex
    });

    // If this is an outdated request, disregard the results
    if (currentRequestRef.current !== id) {
      return;
    }

    // Set the data and pageCount
    setData(rows);
    setState(old => ({
      ...old,
      pageCount
    }));

    setLoading(false);
  };

  // When sorting, filters, pageSize, or pageIndex change, fetch new data
  useEffect(
    () => {
      fetchData();
    },
    [sortBy, filters, pageIndex, pageSize]
  );

  return (
    <Table
      {...{
        data,
        columns,
        infinite,
        state, // Pass the state to the table
        loading,
        manualSorting: true, // Manual sorting
        manualFilters: true, // Manual filters
        manualPagination: true, // Manual pagination
        disableMultiSort: true, // Disable multi-sort
        disableGrouping: true, // Disable grouping
        debug: true
      }}
    />
  );
}
