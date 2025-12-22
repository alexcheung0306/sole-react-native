import React, { useEffect } from 'react';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { TalentFormValues } from './TalentInfoFormPortal';

interface ComcardTemplatePdfProps {
  values: TalentFormValues;
  setFieldValue: (field: string, value: any) => void;
  hasErrors: boolean;
}

export const ComcardTemplatePdf = ({
  values,
  setFieldValue,
  hasErrors,
}: ComcardTemplatePdfProps) => {
  const generateHtml = (): string => {
    const getImageSrc = (index: number) => {
      return values.photoConfig?.[index] || 'https://via.placeholder.com/400x500?text=Photo';
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              width: 1684px;
              height: 1190px;
              background: white;
            }
            .container {
              display: flex;
              flex-direction: column;
              margin: 20px;
              margin-bottom: 0;
              width: 1644px;
              height: 1150px;
              justify-content: space-between;
            }
            .gallery-container {
              display: flex;
              flex-direction: row;
              margin-bottom: 20px;
              width: 1644px;
              height: 1015px;
              justify-content: space-between;
            }
            .left-column {
              width: 812px;
              height: 1015px;
              margin-right: 10px;
              position: relative;
            }
            .main-image {
              width: 812px;
              height: 1015px;
              object-fit: cover;
            }
            .talent-name-overlay {
              position: absolute;
              bottom: 10px;
              left: 10px;
              color: ${values.talentNameColor || '#000'};
              padding: 5px;
              font-size: 48px;
              font-weight: bold;
            }
            .right-column {
              width: 812px;
              height: 1015px;
              margin-left: 10px;
            }
            .image-grid-container {
              width: 812px;
              display: flex;
              flex-direction: column;
            }
            .image-grid-row {
              display: flex;
              flex-direction: row;
              width: 812px;
              height: 495px;
              margin-bottom: 15px;
            }
            .image-grid-row:last-child {
              margin-bottom: 0;
              margin-top: 10px;
            }
            .grid-image-left {
              width: 396px;
              height: 495px;
              object-fit: cover;
              margin-right: 10px;
            }
            .grid-image-right {
              width: 396px;
              height: 495px;
              object-fit: cover;
              margin-left: 10px;
            }
            .info-container {
              display: flex;
              flex-direction: row;
              width: 1644px;
              height: 115px;
              justify-content: space-between;
            }
            .logo-container {
              height: 115px;
              width: 812px;
              display: flex;
              justify-content: center;
              align-items: center;
              margin-right: 20px;
            }
            .logo-text {
              font-size: 36px;
              font-weight: bold;
              color: #000;
            }
            .grid-container {
              height: 115px;
              width: 812px;
              display: flex;
              flex-direction: row;
              flex-wrap: wrap;
              justify-content: center;
              align-content: flex-end;
            }
            .grid-item {
              display: flex;
              flex-direction: row;
              align-items: center;
              width: 25%;
              margin-bottom: 10px;
            }
            .item-title {
              width: 50%;
              font-weight: bold;
              font-size: 24px;
              margin-right: 5px;
            }
            .item-content {
              font-size: 24px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Gallery Section -->
            <div class="gallery-container">
              <!-- Left Column - Main Photo -->
              <div class="left-column">
                <img src="${getImageSrc(0)}" class="main-image" alt="Main Photo" />
                <div class="talent-name-overlay">${values.talentName || 'Talent Name'}</div>
              </div>

              <!-- Right Column - Photo Grid -->
              <div class="right-column">
                <div class="image-grid-container">
                  <!-- First Row -->
                  <div class="image-grid-row">
                    <img src="${getImageSrc(1)}" class="grid-image-left" alt="Photo 2" />
                    <img src="${getImageSrc(2)}" class="grid-image-right" alt="Photo 3" />
                  </div>
                  <!-- Second Row -->
                  <div class="image-grid-row">
                    <img src="${getImageSrc(3)}" class="grid-image-left" alt="Photo 4" />
                    <img src="${getImageSrc(4)}" class="grid-image-right" alt="Photo 5" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Info Section -->
            <div class="info-container">
              <!-- Logo -->
              <div class="logo-container">
                <div class="logo-text">Sole.</div>
              </div>

              <!-- Measurements Grid -->
              <div class="grid-container">
                <div class="grid-item">
                  <div class="item-title">Gender</div>
                  <div class="item-content">${values.gender || '-'}</div>
                </div>
                <div class="grid-item">
                  <div class="item-title">Hair</div>
                  <div class="item-content">${values.hairColor || '-'}</div>
                </div>
                <div class="grid-item">
                  <div class="item-title">Eyes</div>
                  <div class="item-content">${values.eyeColor || '-'}</div>
                </div>
                <div class="grid-item">
                  <div class="item-title">Shoes</div>
                  <div class="item-content">${values.shoes || '-'}</div>
                </div>
                <div class="grid-item">
                  <div class="item-title">Height</div>
                  <div class="item-content">${values.height || '-'}</div>
                </div>
                <div class="grid-item">
                  <div class="item-title">Chest</div>
                  <div class="item-content">${values.chest || '-'}</div>
                </div>
                <div class="grid-item">
                  <div class="item-title">Waist</div>
                  <div class="item-content">${values.waist || '-'}</div>
                </div>
                <div class="grid-item">
                  <div class="item-title">Hip</div>
                  <div class="item-content">${values.hip || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  useEffect(() => {
    const generatePdfBase64 = async () => {
      if (hasErrors) {
        return;
      }

      try {
        const html = generateHtml();
        const { uri } = await Print.printToFileAsync({ html });

        // Read the PDF file and convert to base64 using expo-file-system
        const base64data = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64' as any,
        });

        // Convert to data URL format
        const pdfDataUrl = `data:application/pdf;base64,${base64data}`;
        setFieldValue('pdf', pdfDataUrl);
      } catch (error) {
        console.error('Error generating PDF:', error);
      }
    };

    generatePdfBase64();
  }, [
    values.photoConfig,
    values.talentName,
    values.talentNameColor,
    values.gender,
    values.hairColor,
    values.eyeColor,
    values.shoes,
    values.height,
    values.chest,
    values.waist,
    values.hip,
    hasErrors,
    setFieldValue,
  ]);

  return null; // This component doesn't render anything visible
};
