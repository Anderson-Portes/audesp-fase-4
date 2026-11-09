import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import type {
  ColumnDef,
  SortingState,
  VisibilityState,
  RowSelectionState,
} from '@tanstack/react-table';
import { 
  Card, 
  Table, 
  Form, 
  Button, 
  ButtonGroup, 
  Dropdown, 
  InputGroup 
} from 'react-bootstrap';
import { Download, FileText, Settings2, Search, ChevronUp, ChevronDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  title?: string;
  enableSelection?: boolean;
  selectedRows?: Record<string, boolean>;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;
  getRowId?: (row: TData, index: number) => string;
  renderBatchActions?: (selectedRows: TData[], clearSelection: () => void) => React.ReactNode;
}

export function DataTable<TData>({
  columns,
  data,
  title = 'Dados',
  enableSelection = false,
  selectedRows,
  onRowSelectionChange,
  getRowId,
  renderBatchActions,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({});
  
  // Custom Pagination state defaults to 10 rows
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const rowSelectionState = selectedRows !== undefined ? selectedRows : internalRowSelection;
  const setRowSelection = onRowSelectionChange || setInternalRowSelection;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      pagination,
      rowSelection: rowSelectionState,
    },
    enableRowSelection: enableSelection,
    getRowId: getRowId || ((_, index) => String(index)),
    onRowSelectionChange: setRowSelection as any,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedData = table.getSelectedRowModel().rows.map(r => r.original);
  const clearSelection = () => table.resetRowSelection();

  // Export to CSV
  const exportCSV = () => {
    const headers = table.getAllLeafColumns()
      .filter((col: any) => col.getIsVisible() && col.id !== 'select' && col.id !== 'acoes')
      .map((col: any) => {
        const h = col.columnDef.header;
        return typeof h === 'string' ? h : col.id;
      });
    
    const rows = table.getRowModel().rows.map((row: any) => {
      return row.getVisibleCells()
        .filter((cell: any) => cell.column.id !== 'select' && cell.column.id !== 'acoes')
        .map((cell: any) => {
          const value = cell.getValue();
          return value !== null && value !== undefined ? `"${String(value).replace(/"/g, '""')}"` : '""';
        }).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.replace(/\s+/g, '_').toLowerCase()}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    const headers = table.getAllLeafColumns()
      .filter((col: any) => col.getIsVisible() && col.id !== 'select' && col.id !== 'acoes')
      .map((col: any) => {
        const h = col.columnDef.header;
        return typeof h === 'string' ? h : col.id;
      });
    
    const rows = table.getRowModel().rows.map((row: any) => 
      row.getVisibleCells()
        .filter((cell: any) => cell.column.id !== 'select' && cell.column.id !== 'acoes')
        .map((cell: any) => {
          const value = cell.getValue();
          return value !== null && value !== undefined ? String(value) : '';
        })
    );

    doc.text(`Relatório: ${title}`, 14, 15);
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [40, 167, 69] } // Success color
    });
    
    doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}_export.pdf`);
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-white py-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
        {/* Search com InputGroup do React-Bootstrap */}
        <InputGroup style={{ maxWidth: '300px' }}>
          <InputGroup.Text className="bg-light border-end-0">
            <Search size={16} className="text-muted" />
          </InputGroup.Text>
          <Form.Control
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            className="border-start-0 bg-light"
            placeholder="Pesquisar..."
          />
        </InputGroup>

        {/* Actions */}
        <div className="d-flex align-items-center gap-2">
          {/* Column Visibility Dropdown com React-Bootstrap */}
          <Dropdown align="end">
            <Dropdown.Toggle variant="outline-secondary" size="sm" className="d-flex align-items-center gap-2">
              <Settings2 size={16} /> Colunas
            </Dropdown.Toggle>
            <Dropdown.Menu className="p-2 shadow" style={{ minWidth: '200px' }}>
              <div className="mb-2 fw-bold text-muted small px-2">Mostrar/Ocultar</div>
              {table.getAllLeafColumns()
                .filter((column: any) => column.id !== 'select')
                .map((column: any) => (
                  <div key={column.id} className="px-2 py-1">
                    <Form.Check
                      type="checkbox"
                      id={`col-${column.id}`}
                      label={
                        typeof column.columnDef.header === 'string'
                          ? column.columnDef.header
                          : column.id
                      }
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                      className="small user-select-none"
                    />
                  </div>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          <Button 
            variant="outline-success" 
            size="sm" 
            onClick={exportCSV} 
            className="d-flex align-items-center gap-2" 
            title="Exportar CSV"
          >
            <FileText size={16} /> CSV
          </Button>
          
          <Button 
            variant="outline-danger" 
            size="sm" 
            onClick={exportPDF} 
            className="d-flex align-items-center gap-2" 
            title="Exportar PDF"
          >
            <Download size={16} /> PDF
          </Button>
        </div>
      </Card.Header>

      {/* Barra de Ações Coletivas quando houver itens selecionados */}
      {enableSelection && selectedData.length > 0 && renderBatchActions && (
        <div className="bg-light border-bottom px-3 py-2 d-flex flex-wrap align-items-center justify-content-between gap-2 animate-fadeIn">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary fs-6 fw-normal">
              {selectedData.length} item(ns) selecionado(s)
            </span>
            <Button
              variant="link"
              size="sm"
              className="text-decoration-none p-0 text-muted small"
              onClick={clearSelection}
            >
              Desmarcar todos
            </Button>
          </div>
          <div className="d-flex align-items-center gap-2">
            {renderBatchActions(selectedData, clearSelection)}
          </div>
        </div>
      )}

      <Card.Body className="p-0">
        <Table responsive hover striped className="mb-0">
          <thead className="table-light">
            {table.getHeaderGroups().map((headerGroup: any) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => (
                  <th 
                    key={header.id} 
                    style={{ width: header.getSize() !== 150 ? header.getSize() : 'auto' }}
                    className="text-nowrap"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? 'cursor-pointer user-select-none d-flex align-items-center gap-1'
                            : '',
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                        style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ChevronUp size={16} className="text-success" />,
                          desc: <ChevronDown size={16} className="text-success" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length > 0 ? (
              table.getRowModel().rows.map((row: any) => (
                <tr key={row.id} className={row.getIsSelected() ? 'table-primary bg-opacity-10' : ''}>
                  {row.getVisibleCells().map((cell: any) => (
                    <td key={cell.id} className="align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-4 text-muted">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card.Body>
      
      {/* Pagination com Form.Select e ButtonGroup */}
      <Card.Footer className="bg-white border-top-0 py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">
            Mostrando {table.getRowModel().rows.length} de {table.getFilteredRowModel().rows.length} registros
          </span>
          <Form.Select
            size="sm"
            style={{ width: '80px' }}
            value={table.getState().pagination.pageSize}
            onChange={e => {
              table.setPageSize(Number(e.target.value));
            }}
          >
            {[5, 10, 20, 50, 100].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </Form.Select>
        </div>
        
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small me-2">
            Página <strong>{table.getState().pagination.pageIndex + 1}</strong> de{' '}
            <strong>{table.getPageCount() || 1}</strong>
          </span>
          <ButtonGroup size="sm">
            <Button
              variant="outline-secondary"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              {'<<'}
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {'<'}
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {'>'}
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              {'>>'}
            </Button>
          </ButtonGroup>
        </div>
      </Card.Footer>
    </Card>
  );
}
