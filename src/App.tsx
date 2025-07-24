import React, { useEffect, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "./App.css";

interface Product {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

const ArtworkTable: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Product[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const rowsPerPage: number = 12;
  const op = useRef<OverlayPanel>(null);

  const loadData = async (page: number): Promise<void> => {
    const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page + 1}&limit=${rowsPerPage}`);
    const data = await response.json();
    setProducts(data.data);
    setTotalRecords(data.pagination.total);
  };

  useEffect(() => {
    loadData(currentPage);
  }, [currentPage]);

  useEffect(() => {
    const currentSelected: Product[] = products.filter((p) => selectedRowIds.has(p.id));
    setSelectedRows(currentSelected);
  }, [products, selectedRowIds]);

  const handleSelectionChange = (e: { value: Product[] }): void => {
    const currentPageSelection: Product[] = e.value;
    const updatedIds: Set<number> = new Set(selectedRowIds);

    const currentPageIds: number[] = products.map((p) => p.id);
    const selectedIds: number[] = currentPageSelection.map((p) => p.id);

    currentPageIds.forEach((id) => {
      if (!selectedIds.includes(id)) {
        updatedIds.delete(id);
      }
    });

    selectedIds.forEach((id) => updatedIds.add(id));

    setSelectedRowIds(updatedIds);
  };

  const handleClick = (event: React.MouseEvent): void => {
    op.current?.toggle(event);
  };

  const handleSubmit = async (): Promise<void> => {
    const count: number = parseInt(inputValue);
    if (isNaN(count) || count <= 0) return;

    let newIds: Set<number> = new Set<number>();
    let page: number = 1;
    let remaining: number = count;

    while (remaining > 0) {
      const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}&limit=100`);
      const data = await response.json();
      const rows: Product[] = data.data;

      for (let item of rows) {
        if (!newIds.has(item.id)) {
          newIds.add(item.id);
          remaining--;
        }
        if (remaining <= 0) break;
      }

      if (!data.pagination || !data.pagination.total_pages || page >= data.pagination.total_pages) {
        break;
      }
      page++;
    }

    setSelectedRowIds(newIds);
    op.current?.hide();
    setInputValue("");
  };

  return (
    <div className="card" style={{ padding: "2rem" }}>
      <h2>Artworks Table with Input-Based Global Selection</h2>

      <OverlayPanel ref={op}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "200px" }}>
          <InputText
            placeholder="Enter number of rows to select"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Button label="Submit" icon="pi pi-check" onClick={handleSubmit} className="p-button-sm" />
        </div>
      </OverlayPanel>

      <h4>{selectedRowIds.size} row(s) globally selected</h4>

      <DataTable
        value={products}
        selection={selectedRows}
        onSelectionChange={handleSelectionChange}
        dataKey="id"
        paginator
        rows={rowsPerPage}
        totalRecords={totalRecords}
        onPage={(e) => setCurrentPage(e.page)}
      >
        <Column selectionMode="multiple" headerStyle={{ width: '3em' }} />
        <Column field="title" header="Title" sortable />
        <Column field="artist_display" header="Artist" sortable />
        <Column field="place_of_origin" header="Place of Origin" sortable />
        <Column field="date_start" header="Date Start" sortable />
        <Column field="date_end" header="Date End" sortable />
      </DataTable>
      <Button label="Select Rows" icon="pi pi-plus" onClick={handleClick} />
    </div>
  );
};

export default ArtworkTable;
