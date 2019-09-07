import React, {
    forwardRef,
    useRef,
    useState,
    useEffect,
    useLayoutEffect,
} from 'react'
import { FixedSizeList as List } from 'react-window'
import {
    useTable,
    useColumns,
    useRows,
    useFilters,
    useSortBy,
    useExpanded,
    usePagination,
    useFlexLayout,
    useResizer,
} from '../react-table'

import Pagination from 'antd/lib/pagination'
import 'antd/lib/pagination/style/css' /* eslint-disable-line */

const Table = forwardRef(({ children, ...restProps }, ref) => (
    <div {...restProps} ref={ref} className="xtable">
        {children}
    </div>
))
const HeaderRow = forwardRef(({ children, scrollX, ...restProps }, ref) => {
    const props = { ...restProps }
    props.style.left = 0 - scrollX
    return (
        <div {...props} ref={ref} className="xtable-header-row">
            {children}
        </div>
    )
})
const Header = forwardRef(
    ({ children, sorted, sortedIndex, sortedDesc, ...restProps }, ref) => (
        <div {...restProps} ref={ref} className="xtable-header">
            {children}
        </div>
    )
)
const Body = forwardRef(({ children, ...restProps }, ref) => (
    <div {...restProps} ref={ref} className="xtable-body">
        {children}
    </div>
))
const Row = forwardRef(({ children, ...restProps }, ref) => (
    <div {...restProps} ref={ref} className="xtable-row">
        {children}
    </div>
))
const Cell = forwardRef(({ children, ...restProps }, ref) => (
    <div {...restProps} ref={ref} className="xtable-cell">
        {children}
    </div>
))
const Resizer = forwardRef(({ children, ...restProps }, ref) => (
    <div {...restProps} ref={ref} className="xtable-resizer">
        {children}
    </div>
))

const Ceilbar = forwardRef(({ children, ...restProps }, ref) => (
    <div {...restProps} ref={ref} className="xtable-ceilbar">
        {children}
    </div>
))
const Floorbar = forwardRef(({ children, ...restProps }, ref) => (
    <div {...restProps} ref={ref} className="xtable-floorbar">
        {children}
    </div>
))

const useScroll = tableRef => {
    const [pos, setPos] = useState({ x: 0, y: 0 })
    useEffect(() => {
        let handleScroll = e => {
            const { scrollLeft, scrollTop } = e.target
            if (pos.x !== scrollLeft || pos.y !== scrollTop) {
                setPos({
                    x: scrollLeft,
                    y: scrollTop,
                })
            }
        }
        if (tableRef) {
            tableRef.addEventListener('scroll', handleScroll, true)
        }
        return () => {
            if (tableRef) {
                tableRef.removeEventListener('scroll', handleScroll)
            }
        }
    }, [tableRef])
    return pos
}

const useInfiniteScroll = ({ enabled, sortBy, groupBy, filters }) => {
    const listRef = useRef()
    const [scrollToIndex, setScrollToIndex] = useState(0)
    const [rowHeight, setRowHeight] = useState(40)
    const [height, setHeight] = useState(500)
    const [overscan, setOverscan] = useState(5)

    useEffect(() => {
        if (!enabled) {
            return
        }
        if (listRef.current) {
            listRef.current.scrollToItem(scrollToIndex, 'start')
        }
    }, [scrollToIndex])

    useEffect(() => {}, [])

    useLayoutEffect(() => {
        if (!enabled) {
            return
        }
        if (listRef.current) {
            listRef.current.scrollToItem(0, 'start')
        }
    }, [sortBy, groupBy, filters])

    return {
        listRef,
        scrollToIndex,
        setScrollToIndex,
        rowHeight,
        setRowHeight,
        height,
        setHeight,
        overscan,
        setOverscan,
    }
}

export default function MyTable({ loading, infinite, ...props }) {
    const instance = useTable(
        {
            ...props,
        },

        useColumns,
        useRows,
        useResizer,
        useFilters,
        useSortBy,
        useExpanded,
        usePagination,
        useFlexLayout
    )

    const {
        getTableProps,
        headerGroups,
        rows,
        getRowProps,
        page,
        state: [{ pageIndex, pageSize, sortBy, groupBy, filters }],
        prepareRow,
        setPageSize,
        gotoPage,
    } = instance
    const tableProps = getTableProps()

    const { listRef, rowHeight, height, overscan } = useInfiniteScroll({
        enabled: infinite,
        sortBy,
        groupBy,
        filters,
        pageIndex,
        pageSize,
    })

    const scroll = useScroll(tableProps.ref.current)

    let tableBody

    const renderRow = (row, index, style = {}) => {
        if (!row) {
            return (
                <Row {...{ style }}>
                    <Cell>Loading more...</Cell>
                </Row>
            )
        }
        prepareRow(row)
        return (
            <Row {...row.getRowProps({ style, even: index % 2 })}>
                {row.cells.map(cell => {
                    return (
                        <Cell {...cell.getCellProps()}>
                            <span>{cell.render('Cell')}</span>
                        </Cell>
                    )
                })}
            </Row>
        )
    }

    if (infinite) {
        tableBody = (
            <List
                ref={listRef}
                height={height}
                itemCount={rows.length + 1}
                itemSize={rowHeight}
                overscanCount={overscan}
                scrollToAlignment="start"
                {...getRowProps()}
            >
                {({ index, style }) => {
                    const row = rows[index]
                    return renderRow(row, index, style)
                }}
            </List>
        )
    } else {
        tableBody =
            page && page.length ? page.map((row, i) => renderRow(row, i)) : null
    }

    let pagination = (
        <Pagination
            showSizeChanger
            onChange={page => {
                gotoPage(page)
            }}
            onShowSizeChange={(_, pageSize) => {
                setPageSize(pageSize)
            }}
            defaultCurrent={1}
            current={pageIndex}
            total={rows.length}
        />
    )

    return (
        <div>
            <Ceilbar></Ceilbar>
            <Table {...tableProps} className="xtable">
                {headerGroups.map(headerGroup => (
                    <HeaderRow
                        {...headerGroup.getRowProps()}
                        scrollX={scroll.x}
                    >
                        {headerGroup.headers.map(column => (
                            <Header
                                {...column.getHeaderProps()}
                                sorted={column.sorted}
                                sortedDesc={column.sortedDesc}
                                sortedIndex={column.sortedIndex}
                            >
                                <span {...column.getSortByToggleProps()}>
                                    {column.render('Header')}
                                </span>{' '}
                                <Resizer {...column.getResizerProps()} />
                            </Header>
                        ))}
                    </HeaderRow>
                ))}
                <Body>{tableBody}</Body>
            </Table>
            <Floorbar>{pagination}</Floorbar>
        </div>
    )
}
