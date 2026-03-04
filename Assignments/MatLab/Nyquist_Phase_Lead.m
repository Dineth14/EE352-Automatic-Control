% EE352 Automatic Control - Week 11 Activity 01
% Phase Lead Controller Nyquist Diagram
% System: G(s) = k*(1 + T_L*s) / (1 + alpha*T_L*s)

clc;
clear;
close all;

%% Define Generic Parameters
% Since k, T_L, and alpha (<1) are parameters, we choose representative
% numerical values to plot a sketch of the Nyquist diagram.
k = 1;
T_L = 1;
alpha = 0.1; % Note: alpha MUST be < 1 for a phase lead controller

fprintf('--- Phase Lead Controller Parameters ---\n');
fprintf('k       = %.2f\n', k);
fprintf('T_L     = %.2f\n', T_L);
fprintf('alpha   = %.2f\n\n', alpha);

%% Define Transfer Function G(s)
s = tf('s');
G = k * (1 + T_L * s) / (1 + alpha * T_L * s);

disp('Transfer Function G(s):');
disp(G);

%% Determine Key Points Analytically
% 1. Start point (w -> 0): G(j0) = k
% 2. End point (w -> infinity): G(j inf) = k / alpha
% 3. Frequency of maximum phase lead: wm = 1 / (T_L * sqrt(alpha))
w_start = 0;
w_end = inf;
G_start = k;
G_end = k / alpha;
wm = 1 / (T_L * sqrt(alpha));

fprintf('--- Key Nyquist Points ---\n');
fprintf('Start point (w=0):     G(j0) = %.2f\n', G_start);
fprintf('End point (w->inf):    G(j inf) = %.2f\n', G_end);
fprintf('Freq max phase lead:   w_m = %.2f rad/s\n\n', wm);

%% Plot Nyquist Diagram
figure('Name', 'Nyquist Diagram: Phase Lead Controller');
nyquist(G);
hold on;
grid on;
title(sprintf('Nyquist Diagram of Phase Lead Controller (k=%.1f, T_L=%.1f, \\alpha=%.1f)', k, T_L, alpha));

% Re-adjust axes slightly for better viewing of annotations
axes_lim = axis;
axis([min(0, axes_lim(1)) (G_end + 1) axes_lim(3) axes_lim(4)]);

% Highlight important points mathematically
plot(G_start, 0, 'go', 'MarkerSize', 8, 'MarkerFaceColor', 'g');
text(G_start, -0.5, 'w=0 (Start)', 'Color', 'g', 'VerticalAlignment', 'top', 'HorizontalAlignment','center');

plot(G_end, 0, 'ro', 'MarkerSize', 8, 'MarkerFaceColor', 'r');
text(G_end, -0.5, 'w\rightarrow\infty (End)', 'Color', 'r', 'VerticalAlignment', 'top', 'HorizontalAlignment','center');

% Maximum phase point roughly occurs at center of the upper arc
[re, im, w_vec] = nyquist(G); % Get raw data
re = squeeze(re); im = squeeze(im); w_vec = squeeze(w_vec);
% Find the point matching wm closest
[~, idx_wm] = min(abs(w_vec - wm));
plot(re(idx_wm), im(idx_wm), 'k*', 'MarkerSize', 10);
text(re(idx_wm)-0.5, im(idx_wm)+0.5, 'w_m (Max Phase Lead)', 'Color', 'k');

%% Add Explanation
fprintf('--- Nyquist Diagram Sketch Analysis ---\n');
fprintf('For negative frequencies (-w), the plot is a reflection across the real axis.\n');
fprintf('For positive frequencies (+w), the plot is a semi-circle in the UPPER half-plane.\n');
fprintf('This upper semi-circle represents the characteristic "Phase Lead"\n');
fprintf('(since angle is positive) as frequency increases from 0 to infinity.\n');
