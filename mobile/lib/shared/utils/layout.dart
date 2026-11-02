/// Column count for photo grids, so wide screens use the space instead of
/// stretching two columns across a desktop window.
int photoColumnsFor(double width) {
  if (width >= 1100) return 4;
  if (width >= 760) return 3;
  return 2;
}
