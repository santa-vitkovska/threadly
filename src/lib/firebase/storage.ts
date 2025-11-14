import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage } from './config';
import type { MessageAttachment } from './firestore';

/**
 * Upload a file attachment for a message
 */
export const uploadMessageAttachment = async (
  chatId: string,
  file: File
): Promise<MessageAttachment> => {
  const storage = getFirebaseStorage();
  const timestamp = Date.now();
  const fileName = `${timestamp}-${file.name}`;
  const filePath = `chats/${chatId}/attachments/${fileName}`;
  const storageRef = ref(storage, filePath);
  
  // Upload file
  await uploadBytes(storageRef, file);
  
  // Get download URL
  const downloadURL = await getDownloadURL(storageRef);
  
  return {
    url: downloadURL,
    path: filePath,
    type: file.type,
    name: file.name,
    size: file.size,
  };
};

