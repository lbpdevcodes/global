# CLAUDE.md

## Front end: build the UI from ViewComponents

Use [ViewComponent](https://viewcomponent.org) for all front-end work. Views and layouts compose components instead of holding ad-hoc markup. Any UI element that could appear twice gets a component, even a tiny one: buttons, badges, cards, form fields, flash messages, empty states.

**Why:** it's extra work up front, but it makes the UI cheap to change later. A restyle or markup change happens in one component instead of in every view that copied the HTML.

**Reference:** the [LDS button component](https://github.com/leopolicastro/lds/tree/main/app/components/litmus/design_system/button). Follow its shape, not its code.

### Structure

- One directory per component, under the `Ui` namespace: `app/components/ui/button/component.rb` (`Ui::Button::Component`) beside `component.html.erb`.
- Inherit from `ApplicationComponent`.
- Create the files by hand. The stock generator (`bin/rails g view_component:component`) can't produce this layout: even with `--skip-suffix` it names the template `component_component.html.erb`, which the component won't find.

### API

- Keyword arguments only, with defaults for everything optional (`style: :primary`, `size: :default`).
- Map variants to CSS classes in frozen constants (`STYLES = {primary: "...", danger: "..."}.freeze`), so a restyle is a one-constant change. Templates render the computed class list (`token_list`) and never hard-code variant classes.
- Implement `render?` so the component renders nothing when required input is missing, instead of broken markup.
- Offer `extra_classes:` and `extra_attributes:` (data, aria, Stimulus hooks) so callers never fork a component for one attribute.
- Use slots (`renders_one`, `renders_many`) or the content block for nested markup, not HTML passed in string arguments.
- Metz rules: the initializer's keyword arguments are the component's public API, so the 4-parameter limit is relaxed there. The 100-line class and 5-line method limits still apply. When a component grows, move attribute building or variant logic into small collaborators, or split the component.

### Specs and previews

- Spec every component at `spec/components/ui/button/component_spec.rb` with `type: :component`. Call `render_inline`, then assert on the rendered HTML with Capybara matchers: `expect(page).to have_css("button.btn--danger", text: "Delete")`. One behavior per example. Never assert on instance variables or private methods.
- Add a preview at `spec/components/previews/ui/button/component_preview.rb` (`Ui::Button::ComponentPreview`), with one method per meaningful variant. In development, previews are served at `/rails/view_components`.
