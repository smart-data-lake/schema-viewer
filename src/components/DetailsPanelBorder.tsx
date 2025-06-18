import { Box } from '@mui/joy';

export default function DetailsPanelBorder(props: { setDetailsPanelWidth: (width: number) => void }) {

  function startDragging() {
    document.body.addEventListener('mousemove', moveBorder);
    document.body.addEventListener('mouseup', stopDragging);
  }

  function moveBorder(e: MouseEvent) {
    props.setDetailsPanelWidth(document.body.clientWidth - e.clientX);
  }

  function stopDragging() {
    document.body.removeEventListener('mousemove', moveBorder);
    document.body.removeEventListener('mouseup', stopDragging);
  }

  return (
    <Box sx={{
      borderLeft: 1,
      borderRight: 1,
      borderColor: theme => theme.palette.background.level3,
      width: '3px',
      minWidth: '3px',
      cursor: 'col-resize',
    }} onMouseDown={startDragging} />
  );
}