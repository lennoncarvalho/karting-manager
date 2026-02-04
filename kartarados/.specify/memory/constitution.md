<!--
  Sync Impact Report:
  Version change: 0.0.0 → 1.0.0 (MAJOR: Initial constitution creation)
  Modified principles: N/A (new document)
  Added sections: Core Principles (4 principles), Quality Standards, Development Workflow, Governance
  Removed sections: N/A
  Templates requiring updates:
    - ✅ plan-template.md (Constitution Check section will reference these principles)
    - ✅ spec-template.md (will align with code quality and UX consistency requirements)
    - ✅ tasks-template.md (will reflect quality gates and testing requirements)
  Follow-up TODOs: None
-->

# Kartarados Constitution

## Core Principles

### I. Code Quality (NON-NEGOTIABLE)

All code MUST meet minimum quality standards before being merged. This includes:
- **Readability**: Code MUST be self-documenting with clear naming conventions; complex logic MUST include comments explaining the "why"
- **Maintainability**: Functions MUST be single-purpose and follow SOLID principles; cyclomatic complexity MUST remain below 10 per function
- **Standards Compliance**: Code MUST pass all linting rules and formatting standards; no warnings or errors allowed in CI/CD pipeline
- **Documentation**: Public APIs, complex algorithms, and architectural decisions MUST be documented

**Rationale**: High code quality reduces technical debt, accelerates development velocity, and minimizes production incidents. Quality is not negotiable and cannot be deferred.

### II. Mobile-First Design

All user-facing features MUST be designed and implemented with mobile devices as the primary target:
- **Responsive Design**: All interfaces MUST be fully functional and visually consistent across screen sizes from 320px (mobile) to 4K displays
- **Touch Interactions**: Interactive elements MUST have minimum 44x44px touch targets; gestures MUST follow platform conventions (iOS/Android)
- **Platform Optimization**: Native mobile apps MUST follow platform-specific design guidelines (Material Design, Human Interface Guidelines)

**Rationale**: Mobile devices represent the majority of user interactions. Features that don't work well on mobile fail to serve our primary user base.

### III. User Experience Consistency

User interfaces and interactions MUST maintain consistency across the entire application:
- **Design System**: All UI components MUST use a shared design system; custom components MUST be approved and added to the system before use
- **Interaction Patterns**: Similar actions MUST behave consistently across features; navigation patterns MUST be predictable and follow established conventions
- **Visual Language**: Colors, typography, spacing, and iconography MUST follow the established visual language; deviations require explicit justification
- **Error Handling**: Error messages MUST be user-friendly, actionable, and consistent in tone; error states MUST be clearly distinguishable from success states
- **i18n**: The app uses the JS library i18next, all static strings MUST be localized
- **Cache**: Always cache the results from API calls to avoid unnecessary network requests, and delete/update those accordingly


**Rationale**: Consistent UX reduces cognitive load, accelerates user learning, and builds trust. Inconsistency creates confusion and erodes user confidence.

### IV. Performance Requirements

All features MUST meet defined performance benchmarks before deployment:
- **Frontend Performance**: First Contentful Paint (FCP) MUST be under 1.8 seconds; Largest Contentful Paint (LCP) MUST be under 2.5 seconds
- **Resource Efficiency**: JavaScript bundles MUST be code-split and lazy-loaded; images MUST be optimized and use modern formats (WebP, AVIF)

**Rationale**: Performance directly impacts user satisfaction, conversion rates, and operational costs. Poor performance is a feature failure.

## Quality Standards

### Code Review Requirements

- Reviewers MUST verify constitution compliance (code quality, mobile-friendliness, UX consistency, performance)
- Review feedback addressing constitution violations MUST be resolved before approval

### Performance Budgets

- JavaScript bundle size: Maximum 400KB initial load (gzipped)
- API response time: p95 < 200ms, p99 < 500ms
- Page load: FCP < 1.8s, LCP < 2.5s, TTI < 5s
- Mobile network: Functional on 3G (750 Kbps) within performance targets

## Development Workflow

### Pre-Implementation

1. **Constitution Check**: All feature specifications MUST be reviewed against constitution principles before implementation begins
2. **Design Review**: UI/UX designs MUST be reviewed for mobile-friendliness and consistency with design system
3. **Performance Planning**: Technical approach MUST include performance considerations and measurement strategy
2. **Free Tier Enforcement**: The app can only work on free static hosting services, that means no backend services unless they are free external services.

### During Implementation

1. **Quality Gates**: Code MUST pass all automated quality checks (linting, formatting, tests) before commit
2. **Mobile Testing**: Features MUST be tested on actual mobile devices or accurate emulators during development
3. **Performance Monitoring**: Performance metrics MUST be measured and validated during development, not deferred to production

### Pre-Deployment

1. **Constitution Compliance Review**: All PRs MUST include a self-assessment of constitution compliance
2. **Performance Validation**: Performance budgets MUST be verified before merge
3. **Accessibility Audit**: New UI components MUST pass automated and manual accessibility checks

## Governance

### Authority and Supremacy

This constitution supersedes all other development practices, coding standards, and project-specific guidelines. When conflicts arise, constitution principles take precedence. All team members, regardless of role or seniority, are responsible for upholding these principles.

### Amendment Process

Constitution amendments require:
1. **Proposal**: Document the proposed change with rationale and impact analysis
2. **Review**: Team review period (minimum 3 business days) with discussion
3. **Approval**: Consensus or majority vote from technical leadership
4. **Version Update**: Semantic versioning (MAJOR.MINOR.PATCH) based on impact:
   - **MAJOR**: Breaking changes to principles or removal of principles
   - **MINOR**: Addition of new principles or significant expansion of existing ones
   - **PATCH**: Clarifications, wording improvements, non-semantic refinements
5. **Propagation**: Update all dependent templates and documentation to reflect changes
6. **Communication**: Announce changes to entire team with migration guidance if needed

### Compliance and Enforcement

- **Self-Assessment**: Developers MUST include constitution compliance notes in PR descriptions
- **Review Gate**: Code reviews MUST verify constitution compliance; violations block merge
- **Retrospectives**: Regular team retrospectives MUST include constitution compliance discussion
- **Escalation**: Persistent violations or proposed exceptions require technical leadership review and explicit approval

### Technical Decision Guidance

When making technical decisions, use this constitution as the primary guide:

1. **Technology Selection**: Choose technologies that enable code quality, mobile support, and performance targets
2. **Architecture Decisions**: Design systems that support scalability, maintainability, and consistent UX
3. **Feature Prioritization**: Prioritize features that enhance mobile experience and user consistency
4. **Trade-off Decisions**: When trade-offs are necessary, document them explicitly and ensure they don't violate core principles
5. **Technical Debt**: Technical debt that violates constitution principles MUST be prioritized for resolution

### Exception Process

Exceptions to constitution principles are strongly discouraged and require:
1. **Justification**: Document why the exception is necessary and what alternatives were considered
2. **Approval**: Technical leadership approval with explicit rationale
3. **Mitigation Plan**: Define plan to address the exception in future iterations
4. **Tracking**: Exception MUST be tracked in project backlog with target resolution date

**Version**: 1.0.0 | **Ratified**: 2026-01-26 | **Last Amended**: 2026-01-26
