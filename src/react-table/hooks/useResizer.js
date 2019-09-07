import { useMemo, useRef, useCallback, useEffect } from 'react'
import PropTypes, { bool } from 'prop-types'
import _ from 'lodash'

import { addActions, actions } from '../actions'
import { defaultState } from './useTableState'
import { flattenBy } from '../utils'

defaultState.resizedColumns = {}
defaultState.resizing = false

addActions({
    resizeColumn: '__resizeColumn__',
})

const propTypes = {
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            width: PropTypes.number,
        })
    ),
}

export const useResizer = props => {
    PropTypes.checkPropTypes(propTypes, props, 'property', 'useResizer')

    const {
        columns,
        rows,
        hooks,
        state: [{ resizedColumns }, setState],
    } = props

    const tableRef = useRef(null)
    const resizingInfo = useRef(undefined)

    const addResizer = (columns, api) => {
        columns.forEach(column => {
            column.getResizerProps = ({ ...overrides }) => ({
                ...((column.resizable === true ||
                    column.resizable === undefined) && {
                    onMouseDown: e => onDragStart(e, column),
                    style: {
                        cursor: 'col-resize',
                    },
                    ...overrides,
                }),
            })
        })

        return columns
    }

    hooks.headers.push(addResizer)

    hooks.getTableProps.push(table => ({
        ref: tableRef,
    }))

    const decorateCells = ({ row, column }) => ({
        'data-columnid': column.id,
    })

    hooks.getCellProps.push(decorateCells)

    const decorateHeaderCells = column => ({
        className: 'header-cell',
        'data-columnid': column.id,
        ...(column.columns && {
            'data-childcolumns': flattenBy(column.columns, 'columns').reduce(
                (prev, next, i) => (prev += `${i > 0 ? ',' : ''}${next.id}`),
                ''
            ),
        }),
    })

    hooks.getHeaderProps.push(decorateHeaderCells)

    const resizeColumn = e => {
        // console.time("resize");
        e.stopPropagation()
        e.preventDefault()
        const { clientX: currentPosition } = e
        const {
            column,
            column: { minWidth = 0, maxWidth },
            initialWidth = 0,
            initialPosition,
            currentWidth,
            bodyCells,
            groupedCells,
        } = resizingInfo.current

        const positionXDelta = currentPosition - initialPosition
        let updatedWidth =
            initialWidth + positionXDelta > 0
                ? initialWidth + positionXDelta
                : 0
        resizingInfo.current.currentWidth =
            bodyCells &&
            bodyCells[0] &&
            bodyCells[0].getBoundingClientRect().width

        // /**
        //  *  Distance Threshold (Experimental)
        //  *  distance from last updated position must exceed (n)th amount
        //  *
        //  *  This works sort of like throttling, it limits the amount of state changes increasingly the greater the number is.
        //  *  It has a snappier feel and at higher values it could seem similar to the debounced/throttle laggy effect.
        //  *  The trick is to find a sweet spot
        //  */
        if (
            currentWidth - updatedWidth >= -0 &&
            currentWidth - updatedWidth <= 0
        )
            return

        if (updatedWidth < minWidth) {
            updatedWidth = minWidth
        }

        if (maxWidth && updatedWidth > maxWidth) {
            updatedWidth = maxWidth
        }

        if (bodyCells)
            bodyCells.forEach(cell => {
                cell.style.width = `${updatedWidth}px`
            })

        if (groupedCells)
            groupedCells.forEach(cell => {
                const { ref, childRefs = [] } = cell

                const updateHeaderdWidth = childRefs.reduce((prev, current) => {
                    prev +=
                        (current && current.getBoundingClientRect().width) || 0

                    return prev
                }, 0)

                ref.style.width = `${updateHeaderdWidth}px`
            })
    }

    const onDragStart = (e, column) => {
        e.preventDefault()

        // Finding all cell refs with selected column id and header cells
        const cellRefs = [
            ...tableRef.current.querySelectorAll(
                `[data-columnid="${column.id}"],
          .header-cell[data-childcolumns]
        `
            ),
        ]

        const bodyCells = []
        const groupedCells = []

        // splitting up body & grouped cells
        cellRefs.forEach(ref => {
            ref.dataset.childcolumns
                ? groupedCells.push({
                      ref,
                      childRefs: ref.dataset.childcolumns
                          .split(',')
                          .map(childColumnId => {
                              return tableRef.current.querySelector(
                                  `[data-columnid="${childColumnId}"]`
                              )
                          }),
                  })
                : bodyCells.push(ref)
        })

        const initialWidth =
            (bodyCells && bodyCells[0].getBoundingClientRect().width) || 0

        resizingInfo.current = {
            column,
            initialWidth,
            initialPosition: e.clientX,
            bodyCells,
            groupedCells,
        }

        document.addEventListener('mousemove', resizeColumn)
        document.addEventListener('mouseup', onDragEnd)

        // change mouse cursor & disable pointer events
        document.body.style.cursor = 'col-resize'
        Object.values(document.body.children).forEach(child => {
            child.style['pointer-events'] = 'none'
        })
    }

    const onDragEnd = () => {
        const { column: resizedColumn, currentWidth } = resizingInfo.current

        setState(old => {
            let newResizedColumns = { ...old.resizedColumns }
            newResizedColumns[resizedColumn.id] = currentWidth

            return {
                ...old,
                resizedColumns: newResizedColumns,
            }
        }, actions.resizeColumn)

        // reset mouse cursor & re-enable pointer events
        document.body.style.cursor = ''
        Object.values(document.body.children).forEach(child => {
            child.style['pointer-events'] = ''
        })

        resizingInfo.current = null
        document.removeEventListener('mouseup', onDragEnd)
        document.removeEventListener('mousemove', resizeColumn)
    }

    return props
}
