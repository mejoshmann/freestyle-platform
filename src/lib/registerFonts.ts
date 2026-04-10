import jsPDF from 'jspdf';
import montserratRegular from '../fonts/montserrat-regular';
import montserratBold from '../fonts/montserrat-bold';

export function registerMontserrat(doc: jsPDF): void {
  doc.addFileToVFS('Montserrat-Regular.ttf', montserratRegular);
  doc.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');
  
  doc.addFileToVFS('Montserrat-Bold.ttf', montserratBold);
  doc.addFont('Montserrat-Bold.ttf', 'Montserrat', 'bold');
}
