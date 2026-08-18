export const usePagination = ({
  currentPage,
  totalPages,
  paginationItemsToDisplay = 5
}: {
  currentPage: number;
  totalPages: number;
  paginationItemsToDisplay?: number;
}) => {
  const paginationItemsToDisplay_ = paginationItemsToDisplay + 2;
  let pages: number[] = [];

  const showLeftEllipsis = currentPage > paginationItemsToDisplay_ - 1;
  const showRightEllipsis = currentPage < totalPages - 2;

  if (totalPages <= paginationItemsToDisplay_) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (showLeftEllipsis && !showRightEllipsis) {
    for (let i = totalPages - paginationItemsToDisplay_ + 2; i <= totalPages; i++)
      pages.push(i);
  } else if (!showLeftEllipsis && showRightEllipsis) {
    for (let i = 1; i <= paginationItemsToDisplay_ - 1; i++) pages.push(i);
  } else {
    for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
  }

  return { pages, showLeftEllipsis, showRightEllipsis };
};
