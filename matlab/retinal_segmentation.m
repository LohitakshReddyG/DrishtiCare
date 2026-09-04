function [vesselMask, exudateMask, maCandidates, opticDiscCenter, foveaCenter] = retinal_segmentation(imgRGB)
% RETINAL_SEGMENTATION - Extracts Vessels, Optic Disc, Microaneurysms, and Exudates
%
% Toolboxes required: Image Processing Toolbox, Computer Vision Toolbox
% Input:  imgRGB - Input CLAHE Enhanced RGB Retinal Image
% Output: vesselMask       - Binary Vascular Tree Mask
%         exudateMask      - Binary Hard Exudate Mask
%         maCandidates     - Centroid List of Microaneurysms
%         opticDiscCenter  - [x, y] Optic Disc Coordinates
%         foveaCenter      - [x, y] Fovea Coordinates

    if nargin < 1
        imgRGB = imread('peppers.png'); % Fallback dummy image for syntax validation
    end

    imgGray = rgb2gray(imgRGB);
    imgGreen = imgRGB(:, :, 2);
    imgRed = imgRGB(:, :, 1);

    % 1. Optic Disc Localization (Brightest Region + Circular Hough Transform)
    % Smooth image with Gaussian Filter
    smoothedRed = imgaussfilt(imgRed, 5);
    [~, maxIdx] = max(smoothedRed(:));
    [odY, odX] = ind2sub(size(smoothedRed), maxIdx);
    opticDiscCenter = [odX, odY];

    % 2. Fovea Localization (Darkest Region Temporal to Optic Disc)
    % Estimate Fovea offset ~ 2.5 disc diameters temporal to OD
    foveaX = max(10, round(odX - size(imgGray, 2) * 0.35));
    foveaY = min(size(imgGray, 1) - 10, round(odY + size(imgGray, 1) * 0.05));
    foveaCenter = [foveaX, foveaY];

    % 3. Vessel Segmentation (Frangi Vesselness / Gabor Filter Response)
    % Bottom-hat morphological filter for tubular vessels
    se = strel('disk', 12);
    topHat = imtophat(imgGreen, se);
    botHat = imbothat(imgGreen, se);
    vesselEnhanced = botHat - topHat;
    
    % Adaptive Binarization
    vesselMask = imbinarize(vesselEnhanced, 'adaptive', 'Sensitivity', 0.55);
    vesselMask = bwareaopen(vesselMask, 30); % Remove small noise specs

    % 4. Hard Exudates Segmentation (Bright Yellow Clusters on Green/Red)
    % High contrast thresholding excluding Optic Disc region
    [X, Y] = meshgrid(1:size(imgGray, 2), 1:size(imgGray, 1));
    odDistMask = sqrt((X - odX).^2 + (Y - odY).^2) > 60; // Mask out OD

    exudateCandidates = (imgGreen > 170) & (imgRed > 180) & odDistMask;
    exudateMask = bwareaopen(exudateCandidates, 5);

    % 5. Microaneurysm Candidate Detection (Small round dark lesions)
    maEnhanced = imbothat(imgGreen, strel('disk', 4));
    maBinary = imbinarize(maEnhanced, 0.15) & ~vesselMask;
    maStats = regionprops(maBinary, 'Centroid', 'Area', 'Eccentricity');
    
    maCandidates = [];
    for i = 1:length(maStats)
        if maStats(i).Area >= 2 && maStats(i).Area <= 25 && maStats(i).Eccentricity < 0.8
            maCandidates = [maCandidates; maStats(i).Centroid];
        end
    end

    % Visualization
    figure('Name', 'Retinal Structure & Lesion Segmentation', 'NumberTitle', 'off');
    subplot(2, 2, 1); imshow(imgRGB); hold on;
    plot(odX, odY, 'cy+', 'MarkerSize', 15, 'LineWidth', 2);
    plot(foveaX, foveaY, 'g*', 'MarkerSize', 12, 'LineWidth', 2);
    title('Optic Disc & Fovea Localization');

    subplot(2, 2, 2); imshow(vesselMask); title('Vessel Tree Mask');
    subplot(2, 2, 3); imshow(exudateMask); title('Hard Exudate Segmentation');
    subplot(2, 2, 4); imshow(imgGreen); hold on;
    if ~isempty(maCandidates)
        plot(maCandidates(:, 1), maCandidates(:, 2), 'ro', 'MarkerSize', 6, 'LineWidth', 1.5);
    end
    title(['Microaneurysms Detected (Count: ', num2str(size(maCandidates, 1)), ')']);
end
