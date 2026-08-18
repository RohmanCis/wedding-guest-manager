export const usePagination = ({
  currentPage,
  totalPages,
  paginationItemsToDisplay = 5
}: {
  currentPage: number;
  totalPages: number;
  paginationItemsToDisplay?: number;
}) => {
  // +2 because the first and last pages are always shown in addition to the window.
  const slots = paginationItemsToDisplay + 2;
  let pages: number[] = [];

  const showLeftEllipsis = currentPage > slots - 1;
  const showRightEllipsis = currentPage < totalPages - 2;

  if (totalPages <= slots) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (showLeftEllipsis && !showRightEllipsis) {
    for (let i = totalPages - slots + 2; i <= totalPages; i++)
      pages.push(i);
  } else if (!showLeftEllipsis && showRightEllipsis) {
    for (let i = 1; i <= slots - 1; i++) pages.push(i);
  } else {
    for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
  }

  return { pages, showLeftEllipsis, showRightEllipsis };
};
