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

export default function ArtworkTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Product[]>([]);
  const [inputValue, setInputValue] = useState("");
  const rowsPerPage = 12;
  const op = useRef<OverlayPanel>(null);

  const loadData = async (page: number) => {
    const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page + 1}&limit=${rowsPerPage}`);
    const data = await response.json();
    setProducts(data.data);
    setTotalRecords(data.pagination.total);
  };

  useEffect(() => {
    loadData(currentPage);
  }, [currentPage]);

  useEffect(() => {
    const currentSelected = products.filter((p) => selectedRowIds.has(p.id));
    setSelectedRows(currentSelected);
  }, [products, selectedRowIds]);

  const handleSelectionChange = (e: any) => {
    const currentPageSelection: Product[] = e.value;
    const updatedIds = new Set(selectedRowIds);

    const currentPageIds = products.map((p) => p.id);
    const selectedIds = currentPageSelection.map((p) => p.id);

    currentPageIds.forEach((id) => {
      if (!selectedIds.includes(id)) {
        updatedIds.delete(id);
      }
    });

    selectedIds.forEach((id) => updatedIds.add(id));

    setSelectedRowIds(updatedIds);
  };

  const handleClick = (event: React.MouseEvent) => {
    op.current?.toggle(event);
  };

  const handleSubmit = async () => {
    const count = parseInt(inputValue);
    if (isNaN(count) || count <= 0) return;

    let newIds = new Set<number>();
    let page = 1;
    let remaining = count;

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
        tableStyle={{ minWidth: "60rem" }}
        className="p-datatable-gridlines"
        stripedRows
        showGridlines
        paginator
        rows={rowsPerPage}
        totalRecords={totalRecords}
        first={currentPage * rowsPerPage}
        onPage={(e: DataTablePageEvent) => setCurrentPage(e.page ?? 0)}
        paginatorTemplate="PrevPageLink PageLinks NextPageLink"
        lazy
      >
        {/* ✅ Fixed selectionMode prop */}
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />

        <Column
          field="title"
          body={(rowData) => rowData.title || "—"}
          header={
            <span style={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={handleClick}>
              <img
                src="Screenshot 2025-07-23 104223.png"
                alt="icon"
                style={{ width: "18px", height: "18px", marginRight: "8px" }}
              />
              Title
            </span>
          }
        />
        <Column field="place_of_origin" header="Origin" body={(rowData) => rowData.place_of_origin || "—"} />
        <Column field="artist_display" header="Artist" body={(rowData) => rowData.artist_display || "—"} />
        <Column field="inscriptions" header="Inscriptions" body={(rowData) => rowData.inscriptions || "—"} />
        <Column field="date_start" header="Start Year" body={(rowData) => rowData.date_start || "—"} />
        <Column field="date_end" header="End Year" body={(rowData) => rowData.date_end || "—"} />
      </DataTable>
    </div>
  );
}
