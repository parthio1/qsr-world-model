"""CLI Terminal Interface for QSR World Model"""

import click
import json
from datetime import date, datetime
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import print as rprint
from src.coordinator.orchestrator import QSROrchestrator
from src.models.schemas import (
    Scenario, RestaurantConfig, PlanningRequest,
    Constraints, AlignmentWeights, ShiftType, WeatherType,
    EvaluationRequest, PlanningResponse, ActualPerformanceData
)
from src.config.settings import settings

console = Console()

@click.group()
def cli():
    """QSR World Model - AI-powered staffing optimization"""
    pass

@cli.command()
@click.option('--shift', type=click.Choice(['breakfast', 'lunch', 'dinner']), required=True, help='Shift type')
@click.option('--weather', type=click.Choice(['sunny', 'cloudy', 'rainy', 'stormy']), default='sunny', help='Weather condition')
@click.option('--day', default='friday', help='Day of week')
@click.option('--location', default='Downtown Atlanta', help='Restaurant location')
@click.option('--events', multiple=True, help='Special events (can specify multiple)')
@click.option('--available-staff', default=15, help='Available staff pool')
@click.option('--profit-weight', default=0.40, help='Profit optimization weight')
@click.option('--customer-weight', default=0.35, help='Customer satisfaction weight')
@click.option('--staff-weight', default=0.25, help='Staff wellbeing weight')
@click.option('--priority', type=click.Choice(['balanced', 'profit_focus', 'service_focus']), default='balanced')
@click.option('--output', type=click.Path(), help='Save results to file')
def plan(shift, weather, day, location, events, available_staff, profit_weight, customer_weight, staff_weight, priority, output):
    """Generate optimal staffing plan for a shift"""
    
    console.print("\n[bold blue]🚀 QSR World Model - Planning Session[/bold blue]\n")
    
    try:
        # Build request
        scenario = Scenario(
            shift=ShiftType(shift),
            date=date.today(),
            day_of_week=day,
            weather=WeatherType(weather),
            special_events=list(events),
            restaurant=RestaurantConfig(
                location=location,
                has_drive_thru=True,
                drive_thru_lanes=2,
                kitchen_capacity="medium"
            )
        )
        
        constraints = Constraints(
            available_staff=available_staff,
            budget_hours=available_staff * 4.5  # Rough estimate
        )
        
        alignment_weights = AlignmentWeights(
            profit=profit_weight,
            customer_satisfaction=customer_weight,
            staff_wellbeing=staff_weight
        )
        
        request = PlanningRequest(
            scenario=scenario,
            constraints=constraints,
            alignment_weights=alignment_weights,
            operator_priority=priority
        )
        
        # Show scenario
        console.print(Panel.fit(
            f"[cyan]Shift:[/cyan] {shift.upper()}\n"
            f"[cyan]Weather:[/cyan] {weather}\n"
            f"[cyan]Day:[/cyan] {day}\n"
            f"[cyan]Location:[/cyan] {location}\n"
            f"[cyan]Events:[/cyan] {', '.join(events) if events else 'None'}\n"
            f"[cyan]Available Staff:[/cyan] {available_staff}",
            title="📋 Scenario",
            border_style="blue"
        ))
        
        # Execute planning
        console.print("\n[yellow]⚙️  Running planning agents...[/yellow]")
        orchestrator = QSROrchestrator()
        
        with console.status("[bold green]Planning in progress..."):
            response = orchestrator.plan_shift(request)
        
        console.print("[green]✓ Planning complete![/green]\n")
        
        # Display all options
        all_evals = [response.restaurant_operator_plan]
        for it in response.iterations:
            all_evals.extend(it.evaluations)
            
        best = response.shadow_operator_best_plan or response.restaurant_operator_plan

        table = Table(title="📊 Staffing Options Evaluated")
        table.add_column("Option", style="cyan")
        table.add_column("Drive-Thru", justify="center")
        table.add_column("Kitchen", justify="center")
        table.add_column("Front", justify="center")
        table.add_column("Total", justify="center", style="bold")
        table.add_column("Score", justify="right")
        table.add_column("Ranking", justify="center")
        
        for eval in all_evals:
            is_best = eval.option.id == best.option.id
            style = "bold green" if is_best else ""
            marker = "⭐ " if is_best else ""
            
            table.add_row(
                f"{marker}{eval.option.id}",
                str(eval.option.staffing.drive_thru),
                str(eval.option.staffing.kitchen),
                str(eval.option.staffing.front_counter),
                str(eval.option.staffing.total),
                f"{eval.scores.overall_score:.3f}",
                eval.scores.ranking,
                style=style
            )
        
        console.print(table)
        
        # Display best decision details
        console.print(f"\n[bold green]🏆 RECOMMENDED STAFFING[/bold green]\n")
        
        console.print(Panel.fit(
            f"[cyan]Drive-Thru:[/cyan] {best.option.staffing.drive_thru} staff\n"
            f"[cyan]Kitchen:[/cyan] {best.option.staffing.kitchen} staff\n"
            f"[cyan]Front Counter:[/cyan] {best.option.staffing.front_counter} staff\n"
            f"[cyan]Total:[/cyan] {best.option.staffing.total} staff\n\n"
            f"[cyan]Overall Score:[/cyan] {best.scores.overall_score:.3f}/1.00 ({best.scores.ranking})\n"
            f"[cyan]Labor Cost:[/cyan] ${best.option.estimated_labor_cost:.2f}",
            title="✨ Best Option",
            border_style="green"
        ))
        
        # Show predicted performance
        metrics = best.simulation.predicted_metrics
        console.print("\n[bold]📈 Predicted Performance[/bold]")
        console.print(f"  • Customers: {metrics.customers_served}")
        console.print(f"  • Revenue: ${metrics.revenue:,.2f}")
        console.print(f"  • Avg Wait: {metrics.avg_wait_time_seconds}s")
        console.print(f"  • Staff Utilization: {metrics.staff_utilization:.1%}")
        console.print(f"  • Order Accuracy: {metrics.order_accuracy:.1%}")
        
        # Show score breakdown
        console.print("\n[bold]🎯 Score Breakdown[/bold]")
        console.print(f"  • Profit: {best.scores.profit.raw_score:.2f} (weighted: {best.scores.profit.weighted:.3f})")
        console.print(f"  • Customer Satisfaction: {best.scores.customer_satisfaction.raw_score:.2f} (weighted: {best.scores.customer_satisfaction.weighted:.3f})")
        console.print(f"  • Staff Wellbeing: {best.scores.staff_wellbeing.raw_score:.2f} (weighted: {best.scores.staff_wellbeing.weighted:.3f})")
        
        if best.scores.strengths:
            console.print("\n[bold green]✓ Strengths[/bold green]")
            for strength in best.scores.strengths:
                console.print(f"  • {strength}")
        
        if best.scores.weaknesses:
            console.print("\n[bold yellow]⚠ Considerations[/bold yellow]")
            for weakness in best.scores.weaknesses:
                console.print(f"  • {weakness}")
        
        console.print(f"\n[dim]Execution time: {response.execution_time_seconds}s[/dim]")
        console.print(f"[dim]Request ID: {response.request_id}[/dim]\n")
        
        # Save to file if requested
        if output:
            output_path = Path(output)
            with open(output_path, 'w') as f:
                json.dump(response.model_dump(mode='json'), f, indent=2, default=str)
            console.print(f"[green]✓ Results saved to {output_path}[/green]\n")
        else:
            # Save to default location
            result_file = Path(settings.results_dir) / f"plan_{response.request_id}.json"
            with open(result_file, 'w') as f:
                json.dump(response.model_dump(mode='json'), f, indent=2, default=str)
            console.print(f"[dim]Results saved to {result_file}[/dim]\n")
        
    except Exception as e:
        console.print(f"[bold red]❌ Error: {e}[/bold red]")
        raise click.Abort()

@cli.command()
@click.option('--plan-file', type=click.Path(exists=True), required=True, help='Planning result JSON file')
@click.option('--customers', type=int, required=True, help='Actual customers served')
@click.option('--revenue', type=float, required=True, help='Actual revenue')
@click.option('--wait-time', type=int, required=True, help='Actual avg wait time (seconds)')
@click.option('--labor-cost', type=float, required=True, help='Actual labor cost')
@click.option('--issues', multiple=True, help='Reported issues (can specify multiple)')
def evaluate(plan_file, customers, revenue, wait_time, labor_cost, issues):
    """Evaluate a completed shift vs prediction"""
    
    console.print("\n[bold blue]🔍 QSR World Model - Evaluation[/bold blue]\n")
    
    try:
        # Load planning result
        with open(plan_file, 'r') as f:
            plan_data = json.load(f)
        
        # Convert to PlanningResponse
        planning_response = PlanningResponse(**plan_data)
        
        # Build actual data
        actual_data = ActualPerformanceData(
            customers_served=customers,
            revenue=revenue,
            avg_wait_time_seconds=wait_time,
            labor_cost=labor_cost,
            reported_issues=list(issues)
        )
        
        # Show comparison
        best_eval = planning_response.shadow_operator_best_plan or planning_response.restaurant_operator_plan
        pred = best_eval.simulation.predicted_metrics
        console.print(Panel.fit(
            f"[yellow]Predicted[/yellow]  →  [green]Actual[/green]\n\n"
            f"Customers:  {pred.customers_served}  →  {customers}\n"
            f"Revenue:    ${pred.revenue:,.0f}  →  ${revenue:,.0f}\n"
            f"Wait Time:  {pred.avg_wait_time_seconds}s  →  {wait_time}s\n"
            f"Labor Cost: ${pred.labor_cost:,.0f}  →  ${labor_cost:,.0f}",
            title="📊 Comparison",
            border_style="blue"
        ))
        
        if issues:
            console.print(f"\n[yellow]Reported Issues:[/yellow]")
            for issue in issues:
                console.print(f"  • {issue}")
        
        # Execute evaluation
        console.print("\n[yellow]⚙️  Analyzing performance...[/yellow]")
        orchestrator = QSROrchestrator()
        
        request = EvaluationRequest(
            planning_response=planning_response,
            actual_data=actual_data
        )
        
        with console.status("[bold green]Evaluating..."):
            eval_response = orchestrator.evaluate_shift(request)
        
        console.print("[green]✓ Evaluation complete![/green]\n")
        
        # Display results
        eval = eval_response.evaluation
        
        console.print(f"[bold]📈 Prediction Quality: {eval_response.prediction_quality.upper()}[/bold]\n")
        
        # Accuracy analysis
        console.print("[bold]�� Accuracy Analysis[/bold]")
        for metric, error in eval.accuracy_analysis.items():
            if metric != "overall_prediction_quality":
                console.print(f"  • {metric}: {error}")
        
        # Root causes
        if eval.root_causes:
            console.print("\n[bold yellow]🔍 Root Causes[/bold yellow]")
            for cause in eval.root_causes:
                console.print(f"  • {cause}")
        
        # Model improvements
        if eval.model_improvements:
            console.print("\n[bold blue]💡 Suggested Improvements[/bold blue]")
            for improvement in eval.model_improvements:
                console.print(f"  • [{improvement['component']}] {improvement['improvement']}")
                console.print(f"    Impact: {improvement['expected_impact']}")
        
        # Decision quality
        console.print("\n[bold green]✓ Decision Quality[/bold green]")
        console.print(f"  • Was optimal: {eval.decision_quality['was_optimal']}")
        console.print(f"  • Would change: {eval.decision_quality['would_change_decision']}")
        console.print(f"  • Notes: {eval.decision_quality['notes']}")
        
        console.print(f"\n[italic]{eval.learning_summary}[/italic]\n")
        
        # Save
        result_file = Path(settings.results_dir) / f"eval_{eval_response.request_id}.json"
        with open(result_file, 'w') as f:
            json.dump(eval_response.model_dump(mode='json'), f, indent=2, default=str)
        console.print(f"[dim]Evaluation saved to {result_file}[/dim]\n")
        
    except Exception as e:
        console.print(f"[bold red]❌ Error: {e}[/bold red]")
        raise click.Abort()

@cli.command()
@click.option('--limit', default=10, help='Number of results to show')
def list_results(limit):
    """List recent planning results"""
    
    console.print("\n[bold blue]📋 Recent Planning Results[/bold blue]\n")
    
    try:
        results_dir = Path(settings.results_dir)
        plan_files = sorted(results_dir.glob("plan_*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
        
        if not plan_files:
            console.print("[yellow]No results found[/yellow]\n")
            return
        
        table = Table()
        table.add_column("Date/Time", style="cyan")
        table.add_column("Shift", justify="center")
        table.add_column("Weather", justify="center")
        table.add_column("Score", justify="right")
        table.add_column("Request ID", style="dim")
        
        for plan_file in plan_files[:limit]:
            with open(plan_file, 'r') as f:
                data = json.load(f)
            
            timestamp = datetime.fromisoformat(data["timestamp"]).strftime("%Y-%m-%d %H:%M")
            best_eval = data.get("shadow_operator_best_plan") or data.get("restaurant_operator_plan")
            score = best_eval["scores"]["overall_score"] if best_eval else 0.0
            
            table.add_row(
                timestamp,
                data["scenario"]["shift"],
                data["scenario"]["weather"],
                f"{score:.3f}",
                data["request_id"][:8]
            )
        
        console.print(table)
        console.print(f"\n[dim]Showing {min(limit, len(plan_files))} of {len(plan_files)} results[/dim]\n")
        
    except Exception as e:
        console.print(f"[bold red]❌ Error: {e}[/bold red]")

if __name__ == '__main__':
    cli()
