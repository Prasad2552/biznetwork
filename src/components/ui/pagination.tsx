import React, { useEffect, useState } from 'react';
import ReactPaginate from 'react-paginate';

// Example items, to simulate fetching from another resource
const items: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

// Define props interface for Items component
interface ItemsProps {
  currentItems: number[];
}

function Items({ currentItems }: ItemsProps) {
  return (
    <>
      {currentItems &&
        currentItems.map((item: number) => (
          <div key={item}>
            <h3>Item #{item}</h3>
          </div>
        ))}
    </>
  );
}

// Define props interface for PaginatedItems component
interface PaginatedItemsProps {
  itemsPerPage: number;
}

// Define type for ReactPaginate onPageChange event
interface PageChangeEvent {
  selected: number;
}

function PaginatedItems({ itemsPerPage }: PaginatedItemsProps) {
  const [itemOffset, setItemOffset] = useState<number>(0);

  const endOffset = itemOffset + itemsPerPage;
  console.log(`Loading items from ${itemOffset} to ${endOffset}`);
  const currentItems = items.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(items.length / itemsPerPage);

  const handlePageClick = (event: PageChangeEvent) => {
    const newOffset = (event.selected * itemsPerPage) % items.length;
    console.log(`User requested page number ${event.selected}, which is offset ${newOffset}`);
    setItemOffset(newOffset);
  };

  return (
    <>
      <Items currentItems={currentItems} />
      <ReactPaginate
        breakLabel="..."
        nextLabel="next >"
        onPageChange={handlePageClick}
        pageRangeDisplayed={5}
        pageCount={pageCount}
        previousLabel="< previous"
        renderOnZeroPageCount={null}
      />
    </>
  );
}

export default PaginatedItems;