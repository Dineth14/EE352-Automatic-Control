% EE352 Automatic Control Assignment
% Computer Aided Control Systems Analysis
%
% Student Name: [YOUR NAME]
% Registration Number: [YOUR REG NUMBER]
% Date: [DATE]

clc;
clear;
close all;

%% 1. Define System Parameters
% REPLACE THESE VALUES WITH YOUR ACTUAL DATA
% DOB: yy-mm-dd
yy = 99; % REPLACE with your birth year (e.g., 99)
mm = 12; % REPLACE with your birth month (e.g., 12)
dd = 31; % REPLACE with your birth day (e.g., 31)

% Serial Number
SE = 123; % REPLACE with your serial number

% Display parameters
fprintf('System Parameters:\n');
fprintf('yy = %d, mm = %d, dd = %d, SE = %d\n', yy, mm, dd, SE);

%% Part 1: System Analysis
fprintf('\n--- Part 1: System Analysis ---\n');

% The system G(s) is described by:
% G(s) = SE / (yy*s^2 + mm*s + dd)
% Note: The prompt text was slightly ambiguous ("yy.s + yy.s 2"), 
% but assuming standard second order form K / (as^2 + bs + c).

num = [SE];
den = [yy, mm, dd];

% 1a. Find roots of denominator and comment on stability
p = roots(den);
fprintf('Poles of the system:\n');
disp(p);

% Stability check
if all(real(p) < 0)
    fprintf(' Stability: The system is STABLE (all poles have negative real parts).\n');
elseif any(real(p) > 0)
    fprintf(' Stability: The system is UNSTABLE (at least one pole has positive real part).\n');
else
    fprintf(' Stability: The system is MARGINALLY STABLE (poles on imaginary axis).\n');
end

% 1b. Describe G(s) as transfer function and plot pole-zero
G = tf(num, den);
disp('Transfer Function G(s):');
disp(G);

figure('Name', 'Part 1b: Pole-Zero Plot');
pzmap(G);
title('Pole-Zero Map of G(s)');
grid on;

% 1c. Obtain Step Response
figure('Name', 'Part 1c: Step Response');
step(G);
title('Step Response of G(s)');
grid on;

% 1d. State Space Description and Verification
sys_ss = ss(G);
disp('State Space Representation:');
disp(sys_ss);

figure('Name', 'Part 1d: State Space Step Response Verification');
step(sys_ss);
title('Step Response of State Space Model');
grid on;

%% Part 2: Iterative Reduction of mm
fprintf('\n--- Part 2: Iterative Reduction of mm ---\n');

mm_values = linspace(mm, 0, 11); % 10 equal steps to 0 means 11 points usually, or 10 intervals. 
% "Reduce ... in 10 equal steps to zero" -> start, start-delta, ..., 0. 
% If we take 11 points, we get exactly the start and 0.
% Let's use 11 points to include both ends.

figure('Name', 'Part 2a: Step Responses (Var mm)');
hold on;
title('Step Responses for varying mm');

figure('Name', 'Part 2b: Pole Locations (Var mm)');
hold on;
title('Pole Locations for varying mm');
xlabel('Real Axis');
ylabel('Imaginary Axis');
grid on;
% Draw axes
xline(0, 'k--');
yline(0, 'k--');

colors = jet(length(mm_values));

for i = 1:length(mm_values)
    current_mm = mm_values(i);
    current_den = [yy, current_mm, dd];
    G_temp = tf(num, current_den);
    
    % 2a. Plot Step Response
    figure(findobj('Name', 'Part 2a: Step Responses (Var mm)'));
    step(G_temp);
    
    % 2b. Plot Poles
    current_poles = roots(current_den);
    figure(findobj('Name', 'Part 2b: Pole Locations (Var mm)'));
    plot(real(current_poles), imag(current_poles), 'x', 'Color', colors(i,:), 'LineWidth', 2, 'MarkerSize', 10);
    
end

figure(findobj('Name', 'Part 2a: Step Responses (Var mm)'));
legend(arrayfun(@(x) sprintf('mm=%.1f',x), mm_values, 'UniformOutput', false), 'Location', 'Best');

figure(findobj('Name', 'Part 2b: Pole Locations (Var mm)'));
legend(arrayfun(@(x) sprintf('mm=%.1f',x), mm_values, 'UniformOutput', false), 'Location', 'Best');

% 2c. Explanation
fprintf('\nObservation for Part 2 (mm -> 0):\n');
fprintf('As mm reduces to 0, the damping term decreases.\n');
fprintf('The poles move towards the imaginary axis.\n');
fprintf('At mm = 0, the poles are purely imaginary, resulting in an undamped, oscillatory response.\n');

%% Part 3: Iterative Reduction of dd
fprintf('\n--- Part 3: Iterative Reduction of dd ---\n');

% Reset mm to original value for this part?
% Prompt says "reduce the value of dd ... and for each value of dd". 
% Usually implies varying one parameter while keeping others constant.
mm = 12; % Resetting mm just in case (replace with your var if needed)

dd_values = linspace(dd, 0, 11);

figure('Name', 'Part 3-1: Step Responses (Var dd)');
hold on;
title('Step Responses for varying dd');

figure('Name', 'Part 3-2: Pole Locations (Var dd)');
hold on;
title('Pole Locations for varying dd');
xlabel('Real Axis');
ylabel('Imaginary Axis');
grid on;
xline(0, 'k--');
yline(0, 'k--');

colors = autumn(length(dd_values));

for i = 1:length(dd_values)
    current_dd = dd_values(i);
    current_den = [yy, mm, current_dd];
    G_temp = tf(num, current_den);
    
    % 3-1. Plot Step Response
    figure(findobj('Name', 'Part 3-1: Step Responses (Var dd)'));
    step(G_temp);
    
    % 3-2. Plot Poles
    current_poles = roots(current_den);
    figure(findobj('Name', 'Part 3-2: Pole Locations (Var dd)'));
    plot(real(current_poles), imag(current_poles), 'o', 'Color', colors(i,:), 'LineWidth', 2, 'MarkerSize', 8);
    
end

figure(findobj('Name', 'Part 3-1: Step Responses (Var dd)'));
legend(arrayfun(@(x) sprintf('dd=%.1f',x), dd_values, 'UniformOutput', false), 'Location', 'Best');

figure(findobj('Name', 'Part 3-2: Pole Locations (Var dd)'));
legend(arrayfun(@(x) sprintf('dd=%.1f',x), dd_values, 'UniformOutput', false), 'Location', 'Best');

% 3-3. Explanation
fprintf('\nObservation for Part 3 (dd -> 0):\n');
fprintf('As dd reduces to 0, the natural frequency decreases.\n');
fprintf('Ideally, one pole stays at real axis or they move along a locus.\n');
fprintf('At dd = 0, the denominator becomes s(yy*s + mm), so one pole is at the origin (s=0).\n');
fprintf('This represents an integrating property (Step response becomes a ramp/unbounded).\n');
