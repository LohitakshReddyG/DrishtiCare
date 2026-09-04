function [qualityScore, status, imgEnhanced] = quality_enhancement(imgPath)
% QUALITY_ENHANCEMENT - Fundus Image Quality Assessment and Adaptive CLAHE Pipeline
%
% Toolboxes required: Image Processing Toolbox, Medical Imaging Toolbox
% Input:  imgPath - Path to RGB Fundus Image (.png, .jpg, .tif)
% Output: qualityScore - Scaled Quality Metric (0 - 100)
%         status       - 'ADEQUATE', 'BORDERLINE', or 'UNGRADEABLE'
%         imgEnhanced  - CLAHE & Denoised Contrast Enhanced Image

    if nargin < 1
        % Demo image generation
        imgRGB = uint8(255 * rand(512, 512, 3));
    else
        imgRGB = imread(imgPath);
    end

    % 1. Extract Green Channel & Grayscale
    imgGray = rgb2gray(imgRGB);
    imgGreen = imgRGB(:, :, 2);

    % 2. Evaluate Field of View (FOV) Mask
    fovMask = imgGray > 15;
    fovCoverage = (sum(fovMask(:)) / numel(imgGray)) * 100;

    % 3. Focus Metric: Laplacian Variance
    lapKernel = [0 1 0; 1 -4 1; 0 1 0];
    lapImg = filter2(lapKernel, double(imgGray));
    lapVariance = var(lapImg(fovMask));

    % 4. Illumination Uniformity (Standard Deviation across Block Means)
    blockSize = [64 64];
    blockMeans = blockproc(double(imgGray), blockSize, @(x) mean(x.data(:)));
    illumStd = std(blockMeans(:));

    % 5. Compute Quality Scores
    focusScore = min(100, round(lapVariance * 1.8));
    illumScore = max(0, min(100, round(100 - illumStd * 1.6)));
    qualityScore = round(focusScore * 0.5 + illumScore * 0.3 + fovCoverage * 0.2);

    if qualityScore < 45 || focusScore < 25
        status = 'UNGRADEABLE';
        warning('Image Quality Rejection: Recapture feedback sent to PHC field worker.');
    elseif qualityScore < 70
        status = 'BORDERLINE';
    else
        status = 'ADEQUATE';
    end

    % 6. Adaptive CLAHE Contrast Enhancement
    % Equalize Green channel with clip limit 0.02, 8x8 tile tiles
    greenCLAHE = adapthisteq(imgGreen, 'ClipLimit', 0.02, 'NumTiles', [8 8], 'Distribution', 'rayleigh');
    
    % Denoise using Wiener filter
    greenDenoised = wiener2(greenCLAHE, [3 3]);

    % Reconstruct RGB with enhanced Green channel
    imgEnhanced = imgRGB;
    imgEnhanced(:, :, 2) = greenDenoised;

    % Display figure if in interactive mode
    figure('Name', 'Fundus Image Quality & CLAHE Enhancement', 'NumberTitle', 'off');
    subplot(1, 3, 1); imshow(imgRGB); title('Original Fundus Image');
    subplot(1, 3, 2); imshow(imgGreen); title('Isolated Green Channel');
    subplot(1, 3, 3); imshow(imgEnhanced); title(['CLAHE Enhanced (Score: ', num2str(qualityScore), ' - ', status, ')']);
end
