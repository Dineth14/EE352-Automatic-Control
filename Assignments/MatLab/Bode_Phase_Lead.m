% EE352 Automatic Control - Week 11 Activity 1.2 & 1.3
% Phase Lead Controller Bode & Maximum Phase Proof
% System: Gc(s) = k*(1 + T_L*s) / (1 + alpha*T_L*s)

clc;
clear;
close all;

%% Part 1.2 & 1.3: Mathematical Proof
fprintf('--- Mathematical Proof for Maximum Phase (1.2 & 1.3) ---\n\n');
fprintf('Given Transfer Function: Gc(s) = k * (1 + T_L*s) / (1 + alpha*T_L*s)\n');
fprintf('Substitute s = jw to find frequency response:\n');
fprintf('  Gc(jw) = k * (1 + j*w*T_L) / (1 + j*alpha*w*T_L)\n\n');

fprintf('1. Phase Angle Equation:\n');
fprintf('  The phase angle phi(w) is the angle of numerator minus angle of denominator:\n');
fprintf('  phi(w) = atan(w*T_L) - atan(alpha*w*T_L)\n\n');

fprintf('2. Finding Frequency of Maximum Phase (w_m):\n');
fprintf('  To maximize phi, we find the derivative d(phi)/dw and set it to 0.\n');
fprintf('  d(phi)/dw = [T_L / (1 + (w*T_L)^2)] - [alpha*T_L / (1 + (alpha*w*T_L)^2)] = 0\n');
fprintf('  => T_L * (1 + (alpha*w*T_L)^2) = alpha*T_L * (1 + (w*T_L)^2)\n');
fprintf('  => 1 + alpha^2 * w^2 * T_L^2 = alpha + alpha * w^2 * T_L^2\n');
fprintf('  => w^2 * T_L^2 * (alpha^2 - alpha) = alpha - 1\n');
fprintf('  => w^2 * T_L^2 * (alpha)(alpha - 1) = -(1 - alpha) = (alpha - 1)\n');
fprintf('  => w^2 * T_L^2 = 1 / alpha\n');
fprintf('  => w_m = 1 / (T_L * sqrt(alpha))    [Proved 1.3]\n\n');

fprintf('3. Finding Maximum Phase (phi_m):\n');
fprintf('  Substitute w_m back into the phase equation:\n');
fprintf('  tan(phi_m) = tan[ atan(w_m*T_L) - atan(alpha*w_m*T_L) ]\n');
fprintf('  Using trig identity: tan(A-B) = (tanA - tanB) / (1 + tanA*tanB)\n');
fprintf('  tan(phi_m) = (w_m*T_L - alpha*w_m*T_L) / (1 + alpha*w_m^2*T_L^2)\n');
fprintf('  tan(phi_m) = w_m*T_L*(1 - alpha) / (1 + alpha*w_m^2*T_L^2)\n');
fprintf('  Substitute w_m * T_L = 1 / sqrt(alpha):\n');
fprintf('  tan(phi_m) = (1/sqrt(alpha)) * (1 - alpha) / (1 + alpha * (1/alpha))\n');
fprintf('  tan(phi_m) = (1 - alpha) / (2*sqrt(alpha))\n\n');

fprintf('4. Deriving sin(phi_m):\n');
fprintf('  Draw a right triangle with Opposite = (1 - alpha) and Adjacent = 2*sqrt(alpha)\n');
fprintf('  Hypotenuse^2 = (1 - alpha)^2 + (2*sqrt(alpha))^2\n');
fprintf('               = 1 - 2*alpha + alpha^2 + 4*alpha\n');
fprintf('               = 1 + 2*alpha + alpha^2\n');
fprintf('               = (1 + alpha)^2\n');
fprintf('  Hypotenuse = 1 + alpha\n\n');
fprintf('  Therefore, sin(phi_m) = Opposite / Hypotenuse\n');
fprintf('             sin(phi_m) = (1 - alpha) / (1 + alpha)    [Proved 1.2]\n\n');

%% Part 1.3: Bode Plot Sketch Verification
% Use generic parameters to sketch
k = 1;
T_L = 1;
alpha = 0.1;

s = tf('s');
Gc = k * (1 + T_L * s) / (1 + alpha * T_L * s);

% Calculate theoretical maximums based on parameters
wm_theoretical = 1 / (T_L * sqrt(alpha));
sin_phi_m = (1 - alpha) / (1 + alpha);
phi_m_theoretical = asind(sin_phi_m); % in degrees

fprintf('--- Plot Verification (k=%.1f, T_L=%.1f, alpha=%.1f) ---\n', k, T_L, alpha);
fprintf('Theoretical w_m   = %.3f rad/s\n', wm_theoretical);
fprintf('Theoretical phi_m = %.3f degrees\n\n', phi_m_theoretical);

% Plot Bode Diagram
figure('Name', 'Bode Diagram: Phase Lead Controller');
opts = bodeoptions;
opts.FreqUnits = 'rad/s';
opts.PhaseMatching = 'on';

[mag, phase, wout] = bode(Gc, {0.01, 100});
mag_db = 20*log10(squeeze(mag));
phase_deg = squeeze(phase);

subplot(2,1,1);
semilogx(wout, mag_db, 'b', 'LineWidth', 2); hold on; grid on;
title(sprintf('Phase Lead Controller Bode Plot (k=%.1f, T_L=%.1f, \\alpha=%.1f)', k, T_L, alpha));
ylabel('Magnitude (dB)');

% Note max magnitude gain
high_freq_gain = 20*log10(k/alpha);
yline(high_freq_gain, 'r--', 'High Freq Gain');
text(0.012, high_freq_gain-2, sprintf('20log_{10}(k/\\alpha) = %.1f dB', high_freq_gain), 'Color', 'r');

subplot(2,1,2);
semilogx(wout, phase_deg, 'b', 'LineWidth', 2); hold on; grid on;
ylabel('Phase (degrees)');
xlabel('Frequency (rad/s)');

% Annotate Maximum Phase Point
[max_phase, idx] = max(phase_deg);
wm_plot = wout(idx);
plot(wm_theoretical, phi_m_theoretical, 'r*', 'MarkerSize', 10);
text(wm_theoretical*1.2, phi_m_theoretical, ...
    sprintf('Max Phase: \\phi_m = %.1f\\circ\nat \\omega_m = %.2f rad/s', phi_m_theoretical, wm_theoretical), ...
    'Color', 'r', 'FontWeight', 'bold');

% Draw lines marking wm
plot([wm_theoretical, wm_theoretical], [0, phi_m_theoretical], 'r--');
yline(0, 'k-');
