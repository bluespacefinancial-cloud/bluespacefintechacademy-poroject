import { Component } from 'react'
import PropTypes from 'prop-types'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'

class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  reload = () => {
    this.setState({ hasError: false })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center py-12">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Something went wrong</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                An unexpected error occurred and the page could not render.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 justify-center">
              <Button onClick={this.reload}>Reload</Button>
              <Button asChild variant="outline" onClick={this.reload}>
                <a href="/dashboard">Go to Dashboard</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

ErrorBoundary.propTypes = { children: PropTypes.node.isRequired }

export default ErrorBoundary
