/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import React, { useMemo, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import CustomPaginator from "./custom-paginator";
import { Skeleton } from "primereact/skeleton";

interface Props {
  column: any;
  data: any;
  totalRecords: number;
  rowClassName?: string;
  currentPage: number;
  setCurrentPage: any;
  rows?: number;
  setRows?: any;
  onRowDoubleClick?: Function;
  onRowClickSetState?: boolean;
  type?: string;
  onClickNavigate?: Function;
  sortable?: boolean;
  footer?: any;
  setSearchQuery?: any;
  searchQuery?: string | undefined;
  isPaginationEnabled?: boolean;
  loading?: boolean;
  selectionMode?: 'single' | 'multiple' | 'checkbox' | 'radiobutton' | null;
  selection?: any;
  onSelectionChange?: (e: any) => void;
  expandedRows?: any;
  onRowToggle?: (e: any) => void;
  rowExpansionTemplate?: (data: any) => React.ReactNode;
  onRowClick?: (e: any) => void;
  showExpander?: boolean;
}

const PrimeDataTable: React.FC<Props> = ({
  column,
  data = [],
  currentPage = 1,
  setCurrentPage,
  rows = 10,
  setRows,
  sortable = true,
  footer = null,
  loading = false,
  isPaginationEnabled = true,
  selectionMode,
  selection,
  onSelectionChange,
  searchQuery,
  expandedRows,
  onRowToggle,
  rowExpansionTemplate,
  onRowClick,
  showExpander = false,
}) => {
  const skeletonRows = useMemo(
    () => Array.from({ length: rows }, (_, i) => ({ id: `__skeleton_${i}` })),
    [rows]
  );

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === "") {
      return data;
    }
    const query = searchQuery.toLowerCase().trim();
    return data.filter((item: any) => {
      // Search across all column fields
      return column.some((col: any) => {
        if (col.field && item[col.field] !== undefined) {
          const fieldValue = String(item[col.field]).toLowerCase();
          return fieldValue.includes(query);
        }
        return false;
      });
    });
  }, [searchQuery, data, column]);

  // Reset to first page when search query changes
  useEffect(() => {
    if (searchQuery !== undefined) {
      setCurrentPage(1);
    }
  }, [searchQuery, setCurrentPage]);

  const filteredTotalRecords = filteredData.length;
  const totalPages = Math.ceil(filteredTotalRecords / rows);

  // Calculate paginated data from filtered data
  const startIndex = (currentPage - 1) * rows;
  const endIndex = startIndex + rows;
  const paginatedData = loading ? skeletonRows : filteredData.slice(startIndex, endIndex);

  const onPageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const customEmptyMessage = () => (
    <div className="no-record-found">
      {/* <img src={noRecord} alt="no-record"></img> */}
      <h4>No records found.</h4>
      <p>No records to show here...</p>
    </div>
  );

  // Prepare DataTable props based on selection mode
  const getDataTableProps = () => {
    const baseProps: any = {
      value: paginatedData,
      className: "table custom-table datatable",
      totalRecords: filteredTotalRecords,
      paginator: false,
      emptyMessage: customEmptyMessage,
      footer: footer,
      dataKey: "id",
      expandedRows: expandedRows,
      onRowToggle: onRowToggle,
      rowExpansionTemplate: rowExpansionTemplate,
      onRowClick: onRowClick,
    };

    if (selectionMode && ['multiple', 'checkbox'].includes(selectionMode)) {
      return {
        ...baseProps,
        selectionMode: selectionMode as 'multiple' | 'checkbox',
        selection: selection,
        onSelectionChange: onSelectionChange
      };
    } else if (selectionMode && ['single', 'radiobutton'].includes(selectionMode)) {
      return {
        ...baseProps,
        selectionMode: selectionMode as 'single' | 'radiobutton',
        selection: selection,
        onSelectionChange: onSelectionChange
      };
    } else {
      return baseProps;
    }
  };

  return (
    <>
      <DataTable {...getDataTableProps()}>
        {showExpander && (
          <Column expander={true} style={{ width: '3rem' }} />
        )}
        {selectionMode && ['multiple', 'checkbox'].includes(selectionMode) && (
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
        )}
        {column?.map((col: any, index: number) => (
          <Column
            key={col.key || col.field || `col-${index}`}
            header={col.header}
            field={col.field}
            body={(rowData: any, options: any) => {
              if (loading) {
                return (
                  <Skeleton
                    width="100%"
                    height="2rem"
                    className="skeleton-glow"
                  />
                );
              }
              
              if (col.body) {
                return col.body(rowData, options);
              }
              
              // Handle case where field value might be an object
              const fieldValue = rowData[col.field];
              if (fieldValue !== null && typeof fieldValue === 'object' && !React.isValidElement(fieldValue)) {
                return JSON.stringify(fieldValue);
              }
              
              return fieldValue;
            }}
            sortable={sortable === false ? false : col.sortable !== false}
            sortField={col.sortField ? col.sortField : col.field}
            className={col.className ? col.className : ""}
          />
        ))}
      </DataTable>
      {isPaginationEnabled && (
        <CustomPaginator
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={filteredTotalRecords}
          onPageChange={onPageChange}
          rows={rows}
          setRows={setRows}
        />
      )}
    </>
  );
};

export default PrimeDataTable;
