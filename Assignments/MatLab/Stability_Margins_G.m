% EE352 Automatic Control - Week 11 Activity 1.4
% Phase Margin and Gain Margin Analysis
% System: G(s) = 2(s+20) / ((s+1)(s+2)(s+3))

clc;
clear;
close all;

%% Define Transfer Function G(s)
% G(s) = 2(s+20) / ((s+1)(s+2)(s+3))
s = tf('s');
num = 2 * (s + 20);
den = (s + 1) * (s + 2) * (s + 3);
G = num / den;

disp('Transfer Function G(s):');
disp(G);

%% 1. Analytical Margin Calculation (Using MATLAB's margin function)
% [Gm, Pm, Wcg, Wcp] = margin(G) calculates exactly:
[Gm, Pm, Wcg, Wcp] = margin(G);
Gm_dB = 20*log10(Gm);

fprintf('\n--- 1. Analytical Calculation Results ---\n');
fprintf('Gain Crossover Frequency (w_cp) = %.3f rad/s\n', Wcp);
fprintf('Phase Margin (PM)                 = %.3f degrees\n\n', Pm);

fprintf('Phase Crossover Frequency (w_cg)= %.3f rad/s\n', Wcg);
if isinf(Gm)
    fprintf('Gain Margin (GM)                  = Infinite (Phase never crosses -180 deg)\n');
else
    fprintf('Gain Margin (GM)                  = %.3f dB\n', Gm_dB);
end

%% 2. Visual Extraction via Bode Data arrays
% Simulates "reading from the diagram" by finding exact crossings
[mag, phase, wout] = bode(G);
mag_db = 20*log10(squeeze(mag));
phase_deg = squeeze(phase);

% Find Phase Margin (Crosses 0 dB)
[~, idx_wcp] = min(abs(mag_db)); % Find where magnitude is closest to 0 dB
Wcp_ext = wout(idx_wcp);
Pm_ext = 180 + phase_deg(idx_wcp);

% Find Gain Margin (Crosses -180 deg)
% We have to be careful if phase never crosses -180.
[~, idx_wcg] = min(abs(phase_deg - (-180))); 

% Basic check if it ever truly got close to -180 (e.g., within 5 degrees)
if abs(phase_deg(idx_wcg) - (-180)) < 5
    Wcg_ext = wout(idx_wcg);
    Gm_ext = 0 - mag_db(idx_wcg); % Distance from 0 dB down to the curve
else
    Wcg_ext = Inf;
    Gm_ext = Inf;
end

fprintf('\n--- 2. Visual Extraction from Bode Arrays ---\n');
fprintf('Extracted w_cp = %.3f rad/s\n', Wcp_ext);
fprintf('Extracted PM   = %.3f degrees\n\n', Pm_ext);

if isinf(Gm_ext)
    fprintf('Extracted w_cg = Inf (Does not cross -180)\n');
    fprintf('Extracted GM   = Inf \n');
else
    fprintf('Extracted w_cg = %.3f rad/s\n', Wcg_ext);
    fprintf('Extracted GM   = %.3f dB\n', Gm_ext);
end

%% 3. Plotting Annotated Bode Diagram
figure('Name', 'Bode Diagram with Stability Margins');

% Magnitude Plot
subplot(2,1,1);
semilogx(wout, mag_db, 'b', 'LineWidth', 1.5); hold on; grid on;
title('Bode Diagram of G(s) = 2(s+20) / ((s+1)(s+2)(s+3))');
ylabel('Magnitude (dB)');

% Highlight 0 dB crossing (Gain Crossover)
yline(0, 'k--', '0 dB');
plot(Wcp_ext, mag_db(idx_wcp), 'ro', 'MarkerSize', 8, 'MarkerFaceColor','r');
text(Wcp_ext*1.2, 5, sprintf('\\omega_{cp} \\approx %.2f', Wcp_ext), 'Color', 'r', 'FontWeight', 'bold');

% Highlight Phase Crossover magnitude distance (Gain Margin)
if ~isinf(Gm_ext)
    plot([Wcg_ext, Wcg_ext], [0, mag_db(idx_wcg)], 'g--', 'LineWidth', 1.5);
    plot(Wcg_ext, mag_db(idx_wcg), 'go', 'MarkerSize', 8, 'MarkerFaceColor','g');
    text(Wcg_ext*1.2, mag_db(idx_wcg)/2, sprintf('GM \\approx %.1f dB', Gm_ext), 'Color', 'g', 'FontWeight', 'bold');
end

% Phase Plot
subplot(2,1,2);
semilogx(wout, phase_deg, 'b', 'LineWidth', 1.5); hold on; grid on;
ylabel('Phase (deg)'); xlabel('Frequency (rad/s)');

% Highlight -180 deg crossing (Phase Crossover)
yline(-180, 'k--', '-180 deg');

% Highlight Phase Margin distance
plot([Wcp_ext, Wcp_ext], [-180, phase_deg(idx_wcp)], 'r--', 'LineWidth', 1.5);
plot(Wcp_ext, phase_deg(idx_wcp), 'ro', 'MarkerSize', 8, 'MarkerFaceColor','r');
text(Wcp_ext*1.2, phase_deg(idx_wcp) - 10, sprintf('PM \\approx %.1f\\circ', Pm_ext), 'Color', 'r', 'FontWeight', 'bold');

if ~isinf(Gm_ext)
    plot(Wcg_ext, phase_deg(idx_wcg), 'go', 'MarkerSize', 8, 'MarkerFaceColor','g');
    text(Wcg_ext*1.2, -180, sprintf('\\omega_{cg} \\approx %.2f', Wcg_ext), 'Color', 'g', 'VerticalAlignment', 'top', 'FontWeight', 'bold');
end
