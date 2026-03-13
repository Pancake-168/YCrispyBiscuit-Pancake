<script setup lang="ts">
</script>

<template>
  <div class="scroll-y home-container">
    <!-- Header Section -->
    <section class="glass-panel header-section">
      <div>
        <h1>Glass UI Showcase</h1>
        <p>Vue Implementation of the Design System</p>
      </div>
      <button class="btn btn-primary">Primary Action</button>
    </section>

    <!-- Grid Layout for Components -->
    <div class="grid-layout">

      <!-- Typography & Colors Card -->
      <div class="glass-card">
        <h2>Typography & Colors</h2>
        <hr class="divider" />
        <h1>Heading 1 (2em)</h1>
        <h2>Heading 2 (1.5em)</h2>
        <h3>Heading 3 (1.17em)</h3>
        <p>Standard paragraph text. Uses <code>var(--text-muted)</code> for better readability on dark backgrounds.</p>
        <div class="color-palette">
          <span style="color: var(--primary-color)">● Primary</span>
          <span style="color: var(--danger-color)">● Danger</span>
          <span style="color: var(--warning-color)">● Warning</span>
          <span style="color: var(--info-color)">● Info</span>
        </div>
      </div>

      <!-- Buttons Card -->
      <div class="glass-card">
        <h2>Interactive Buttons</h2>
        <p class="buttons-desc">Buttons include hover, active effects and focus states.</p>
        <div class="btn-group">
          <button class="btn">Default</button>
          <button class="btn btn-primary">Primary</button>
          <button class="btn btn-danger">Danger</button>
          <button class="btn btn-ghost">Ghost</button>
        </div>
        <br />
        <div class="btn-block-group">
          <button class="btn btn-primary w-full">Block Primary</button>
          <button class="btn w-full">Block Default</button>
        </div>
      </div>

      <!-- Inputs & Forms Card -->
      <div class="glass-card">
        <h2>Form Controls</h2>
        <form class="form-layout" @submit.prevent>
          <div>
            <label class="input-label">Username</label>
            <input class="input" type="text" placeholder="Enter username..." />
          </div>
          <div>
            <label class="input-label">Password</label>
            <input class="input" type="password" placeholder="••••••••" />
          </div>
          <div class="form-actions">
              <button class="btn btn-primary w-full">Sign In</button>
          </div>
        </form>
      </div>

       <!-- Layering & Depth Test -->
       <div class="glass-card layering-card">
          <h2>Depth & Layering</h2>
          <p>This card has a custom tint to demonstrate how the backdrop blur interacts with the background.</p>
          <div class="glass-panel nested-panel">
              <h3>Nested Panel</h3>
              <p>Nested glass elements increase blur and opacity, creating depth.</p>
              <button class="btn btn-ghost">Action inside</button>
          </div>
       </div>

    </div>
    
    <!-- Footer -->
    <footer class="page-footer">
      <p>End of showcase. Try resizing the window to test resizing behavior.</p>
    </footer>
  </div>
</template>

<style scoped src="@/styles/Project/views/Home.css"></style>
