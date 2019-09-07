import React, { useState } from 'react'
import makeData from '../makeData'
import Table from '../components/Table'

export default function({ infinite }) {
    const [data] = useState(() => makeData(1000))
    const [columns] = useState([
        {
            Header: 'Row Index',
            resizable: false,
            accessor: (row, index) => index + 1,
            width: 150,
        },
        {
            Header: 'First Name',
            accessor: 'firstName',
            width: 170,
        },
        {
            Header: 'Last Name',
            id: 'lastName',
            accessor: d => d.lastName,
            width: 140,
        },
        {
            Header: 'Age',
            accessor: 'age',
            width: 100,
            aggregate: 'average',
        },
        {
            Header: 'Visits',
            accessor: 'visits',
            width: 100,
            aggregate: 'sum',
        },
        {
            Header: 'Profile Progress',
            accessor: 'progress',
            aggregate: 'average',
            width: 230,
            Cell: row => (
                <div
                    style={{
                        width: `${row.value}%`,
                        minWidth: '5px',
                        height: '20px',
                        backgroundColor: `hsla(${row.value}, 100%, 45%, 1)`,
                        borderRadius: '2px',
                        transition: 'all .4s ease',
                    }}
                />
            ),
        },
        {
            Header: 'Status',
            resizable: false,
            accessor: 'status',
            maxWidth: 200,
            Cell: row => (
                <span>
                    <span
                        style={{
                            color:
                                row.value === 'relationship'
                                    ? '#ff2e00'
                                    : row.value === 'complicated'
                                    ? '#ffbf00'
                                    : '#57d500',
                            transition: 'all .5s ease',
                        }}
                    >
                        &#x25cf;
                    </span>{' '}
                    {row.value === 'relationship'
                        ? 'Relationship'
                        : row.value === 'complicated'
                        ? `Complicated`
                        : 'Single'}
                </span>
            ),
        },
    ])

    return (
        <Table
            {...{
                data,
                columns,
                infinite,
            }}
        />
    )
}
