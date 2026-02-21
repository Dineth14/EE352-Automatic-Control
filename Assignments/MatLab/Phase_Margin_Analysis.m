% EE352 Automatic Control
% Phase Margin and Gain Crossover Frequency Analysis
% System: G4(s) = 100 / ((s+1)(s+2))

clc;
clear;
close all;

%% Define the Plant Transfer Function G4(s)
% G4(s) = 100 / ((s+1)*(s+2))
s = tf('s');
G4 = 100 / ((s + 1) * (s + 2));

disp('Transfer Function G4(s):');
disp(G4);

%% Extract Phase Margin from Bode Diagram Data Array
% Get exact Bode points without mathematical margin calculation
[mag, phase, wout] = bode(G4);
mag_db = 20*log10(squeeze(mag));
phase_deg = squeeze(phase);

% Find where Magnitude first crosses 0 dB
% By finding the index where magnitude is closest to 0
[min_diff, idx_wcp] = min(abs(mag_db));

% The Gain Crossover Frequency (Wcp) is at this index
Wcp_extracted = wout(idx_wcp);

% The phase at the Gain Crossover Frequency
Phase_at_Wcp = phase_deg(idx_wcp);

% Phase Margin = 180 + Phase at Wcp
Pm_extracted = 180 + Phase_at_Wcp;

fprintf('\n--- Results Extracted from Bode Diagram Data ---\n');
fprintf('Gain Crossover Frequency (Wcp) = %.2f rad/s\n', Wcp_extracted);
fprintf('Phase at Wcp                   = %.2f degrees\n', Phase_at_Wcp);
fprintf('Phase Margin (Pm)              = %.2f degrees\n', Pm_extracted);

%% Plot Bode Diagram and Annotate Extracted Margins
figure('Name', 'Bode Diagram with Extracted Margins');
subplot(2,1,1);
semilogx(wout, mag_db, 'b', 'LineWidth', 1.5);
hold on;
grid on;
title('Bode Diagram of G_4(s) = 100 / ((s+1)(s+2))');
ylabel('Magnitude (dB)');
% Highlight 0 dB line and Wcp
yline(0, 'k--', '0 dB');
plot(Wcp_extracted, mag_db(idx_wcp), 'ro', 'MarkerSize', 8, 'MarkerFaceColor', 'r');
text(Wcp_extracted*1.2, 5, sprintf('\\omega_{cp} \\approx %.2f', Wcp_extracted), 'Color', 'r');

subplot(2,1,2);
semilogx(wout, phase_deg, 'b', 'LineWidth', 1.5);
hold on;
grid on;
ylabel('Phase (deg)');
xlabel('Frequency (rad/s)');
% Highlight -180 deg line and Phase Margin
yline(-180, 'k--', '-180 deg');
plot(Wcp_extracted, Phase_at_Wcp, 'ro', 'MarkerSize', 8, 'MarkerFaceColor', 'r');
plot([Wcp_extracted Wcp_extracted], [-180 Phase_at_Wcp], 'r--', 'LineWidth', 1.5);
text(Wcp_extracted*1.2, Phase_at_Wcp - 10, sprintf('PM \\approx %.2f^\\circ', Pm_extracted), 'Color', 'r');
