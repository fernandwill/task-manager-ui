import { useState } from 'react';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { Button } from '@mui/material';
import { Document, Page, Text, View, pdf } from '@react-pdf/renderer';
import dayjs from 'dayjs';
import type { Task } from '../store/tasksStore';

interface ReportDownloadButtonProps {
  tasks: Task[];
}

const TIMESTAMP_FORMAT = 'MMM D, YYYY h:mm A';

const ReportDownloadButton = ({ tasks }: ReportDownloadButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const now = dayjs().format('YYYY-MM-DD_HH-mm');
      const fileName = `task-report-${now}.pdf`;

      const doc = (
        <Document>
          <Page size="A4" style={{ padding: 24 }}>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                Task Manager Report
              </Text>
              <Text>{dayjs().format('MMMM D, YYYY h:mm A')}</Text>
            </View>
            {tasks.map((task) => (
              <View key={task.id} style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold' }}>
                  {task.title}
                </Text>
                {task.description ? (
                  <Text style={{ marginTop: 4 }}>{task.description}</Text>
                ) : null}
                <Text style={{ marginTop: 4 }}>
                  Status: {task.completed ? 'Completed' : 'Pending'}
                </Text>
                <Text>
                  Created: {dayjs(task.created_at).format(TIMESTAMP_FORMAT)}
                </Text>
                <Text>
                  Completed:{' '}
                  {task.completed_at
                    ? dayjs(task.completed_at).format(TIMESTAMP_FORMAT)
                    : 'Pending'}
                </Text>
              </View>
            ))}
            {!tasks.length && (
              <Text>No tasks available at the moment.</Text>
            )}
          </Page>
        </Document>
      );

      const blob = await pdf(doc).toBlob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      size="large"
      startIcon={<PictureAsPdfIcon />}
      onClick={handleDownload}
      disabled={isGenerating}
      data-testid="report-download-button"
      sx={{
        fontWeight: 600,
        boxShadow: 'none',
      }}
    >
      {isGenerating ? 'Preparing report…' : 'Download Report'}
    </Button>
  );
};

export default ReportDownloadButton;
