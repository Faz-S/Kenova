export const processFile = async (file) => {
  if (!file) {
    throw new Error('No file selected');
  }

  const fileType = file.type || '';
  const fileName = file.name.toLowerCase();

  // Validate file type
  if (!isValidFileType(fileType, fileName)) {
    throw new Error('Unsupported file type');
  }

  try {
    const content = await readFileContent(file);
    return content;
  } catch (error) {
    console.error('Error processing file:', error);
    throw new Error('Failed to process file');
  }
};

const isValidFileType = (fileType, fileName) => {
  const validTypes = [
    'text/plain',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const validExtensions = ['.txt', '.pdf', '.doc', '.docx'];

  return validTypes.includes(fileType) || 
         validExtensions.some(ext => fileName.endsWith(ext));
};

const readFileContent = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      resolve(event.target.result);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    if (file.type === 'application/pdf') {
      // Handle PDF files
      reader.readAsArrayBuffer(file);
    } else {
      // Handle text files
      reader.readAsText(file);
    }
  });
};
