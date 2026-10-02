import { Link } from "react-router-dom";
import CommonFooter from "../../components/footer/commonFooter";

const Pagination = () => {
  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content pb-0">
          {/* Page Header */}
          <div className="page-header">
            <div className="page-title">
              <h4>Pagination</h4>
            </div>
          </div>
          {/* End Page Header */}
          <div className="row">
            <div className="col-xl-6">
              <div className="card card-h-100">
                <div className="card-header">
                  <h5 className="card-title">Default Pagination</h5>
                </div>
                <div className="card-body">
                  <p>
                    Looking to use an icon or symbol in place of text for some
                    pagination links? Be sure to provide proper screen reader
                    support with <code>aria</code> attributes.
                  </p>
                  <nav aria-label="Page navigation example">
                    <ul className="pagination">
                      <li className="page-item">
                        <Link
                          className="page-link"
                          to="#"
                          aria-label="Previous"
                        >
                          <span aria-hidden="true">«</span>
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          1
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          2
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          3
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#" aria-label="Next">
                          <span aria-hidden="true">»</span>
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>{" "}
                {/* end card body */}
              </div>{" "}
              {/* end card */}
            </div>{" "}
            {/* end col */}
            <div className="col-xl-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title">Disabled and Active States</h5>
                </div>
                <div className="card-body">
                  <p>
                    Add .disabled to a .page-item to make it appear
                    un-clickable. While .disabled uses pointer-events: none to
                    disable
                    <code>.disabled</code> for links that appear un-clickable
                    and <code>.active</code>
                    to indicate the current page.
                  </p>
                  <nav aria-label="...">
                    <ul className="pagination">
                      <li className="page-item disabled">
                        <Link to="#" className="page-link">
                          Previous
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          1
                        </Link>
                      </li>
                      <li className="page-item active">
                        <Link className="page-link" to="#" aria-current="page">
                          2
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          3
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          Next
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>{" "}
                {/* end card body */}
              </div>{" "}
              {/* end card */}
            </div>{" "}
            {/* end col */}
          </div>
          {/* end row */}
          {/* start row */}
          <div className="row">
            <div className="col-xl-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title">Sizing</h5>
                </div>
                <div className="card-body">
                  <p>
                    Fancy larger or smaller pagination? Add{" "}
                    <code>.pagination-lg</code> or
                    <code>.pagination-sm</code> for additional sizes.
                  </p>
                  <nav aria-label="...">
                    <ul className="pagination pagination-lg mb-3">
                      <li className="page-item active">
                        <Link to="#" className="page-link" aria-current="page">
                          1
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          2
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          3
                        </Link>
                      </li>
                    </ul>
                  </nav>
                  <nav aria-label="...">
                    <ul className="pagination pagination-sm">
                      <li className="page-item active">
                        <Link to="#" className="page-link" aria-current="page">
                          1
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          2
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          3
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>{" "}
                {/* end card body */}
              </div>{" "}
              {/* end card */}
            </div>{" "}
            {/* end col */}
            <div className="col-xl-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title">Alignment</h5>
                </div>
                <div className="card-body">
                  <p>
                    Change the alignment of pagination components with flexbox
                    utilities. For example, with{" "}
                    <code>.justify-content-center</code>: or{" "}
                    <code>.justify-content-end</code>
                  </p>
                  <div className="mb-3">
                    <nav aria-label="Page navigation example mb-3">
                      <ul className="pagination justify-content-center">
                        <li className="page-item disabled">
                          <Link to="#" className="page-link">
                            Previous
                          </Link>
                        </li>
                        <li className="page-item">
                          <Link className="page-link" to="#">
                            1
                          </Link>
                        </li>
                        <li className="page-item">
                          <Link className="page-link" to="#">
                            2
                          </Link>
                        </li>
                        <li className="page-item">
                          <Link className="page-link" to="#">
                            3
                          </Link>
                        </li>
                        <li className="page-item">
                          <Link className="page-link" to="#">
                            Next
                          </Link>
                        </li>
                      </ul>
                    </nav>
                  </div>
                  <nav aria-label="Page navigation example">
                    <ul className="pagination justify-content-end">
                      <li className="page-item disabled">
                        <Link to="#" className="page-link">
                          Previous
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          1
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          2
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          3
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          Next
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>{" "}
                {/* end card body */}
              </div>{" "}
              {/* end card */}
            </div>{" "}
            {/* end col */}
          </div>
          {/* end row */}
          {/* start row */}
          <div className="row">
            <div className="col-xl-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title">Custom Icon Pagination</h5>
                </div>
                <div className="card-body">
                  <p>
                    Add <code> .pagination-boxed</code> for rounded pagination.
                  </p>
                  <nav>
                    <ul className="pagination pagination-boxed flex-wrap gap-lg-0 gap-md-0 gap-1 mb-3">
                      <li className="page-item">
                        <Link
                          className="page-link"
                          to="#"
                          aria-label="Previous"
                        >
                          <i className="ti ti-chevron-left" />
                        </Link>
                      </li>
                      <li className="page-item active">
                        <Link className="page-link" to="#">
                          1
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          2
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          3
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          4
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          5
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#" aria-label="Next">
                          <i className="ti ti-chevron-right align-middle" />
                        </Link>
                      </li>
                    </ul>
                  </nav>
                  <nav>
                    <ul className="pagination pagination-boxed flex-wrap gap-lg-0 gap-md-0 gap-1 mb-3">
                      <li className="page-item">
                        <Link
                          className="page-link"
                          to="#"
                          aria-label="Previous"
                        >
                          <i className="ti ti-arrow-left" />
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          1
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          2
                        </Link>
                      </li>
                      <li className="page-item active">
                        <Link className="page-link" to="#">
                          3
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          4
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          5
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#" aria-label="Next">
                          <i className="ti ti-arrow-right" />
                        </Link>
                      </li>
                    </ul>
                  </nav>
                  <nav>
                    <ul className="pagination pagination-boxed mb-0 flex-wrap gap-lg-0 gap-md-0 gap-1">
                      <li className="page-item">
                        <Link
                          className="page-link"
                          to="#"
                          aria-label="Previous"
                        >
                          <i className="ti ti-chevron-left-pipe align-middle" />
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          1
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          2
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          3
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          4
                        </Link>
                      </li>
                      <li className="page-item active">
                        <Link className="page-link" to="#">
                          5
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#" aria-label="Next">
                          <i className="ti ti-chevron-right-pipe align-middle" />
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>{" "}
                {/* end card body */}
              </div>{" "}
              {/* end card */}
            </div>{" "}
            {/* end col */}
            <div className="col-xl-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title">Boxed Pagination</h5>
                </div>
                <div className="card-body">
                  <p>
                    Add <code> .pagination-boxed</code> for rounded pagination.
                  </p>
                  <nav>
                    <ul className="pagination pagination-sm pagination-boxed flex-wrap gap-lg-0 gap-md-0 gap-1 mb-3">
                      <li className="page-item">
                        <Link
                          className="page-link"
                          to="#"
                          aria-label="Previous"
                        >
                          <span aria-hidden="true">«</span>
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          1
                        </Link>
                      </li>
                      <li className="page-item active">
                        <Link className="page-link" to="#">
                          2
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          3
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          4
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          5
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#" aria-label="Next">
                          <span aria-hidden="true">»</span>
                        </Link>
                      </li>
                    </ul>
                    <ul className="pagination pagination-boxed flex-wrap gap-lg-0 gap-md-0 gap-1 mb-3">
                      <li className="page-item">
                        <Link
                          className="page-link"
                          to="#"
                          aria-label="Previous"
                        >
                          <span aria-hidden="true">«</span>
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          1
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          2
                        </Link>
                      </li>
                      <li className="page-item active">
                        <Link className="page-link" to="#">
                          3
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          4
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          5
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#" aria-label="Next">
                          <span aria-hidden="true">»</span>
                        </Link>
                      </li>
                    </ul>
                    <ul className="pagination pagination-lg pagination-boxed mb-0 flex-wrap gap-lg-0 gap-md-0 gap-1">
                      <li className="page-item">
                        <Link
                          className="page-link"
                          to="#"
                          aria-label="Previous"
                        >
                          <span aria-hidden="true">«</span>
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          1
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          2
                        </Link>
                      </li>
                      <li className="page-item active">
                        <Link className="page-link" to="#">
                          3
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          4
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          5
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#" aria-label="Next">
                          <span aria-hidden="true">»</span>
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>{" "}
                {/* end card body */}
              </div>{" "}
              {/* end card */}
            </div>{" "}
            {/* end col */}
          </div>
          {/* end row */}
          {/* start row  */}
          <div className="row">
            <div className="col-xl-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title">Rounded Pagination</h5>
                </div>
                <div className="card-body">
                  <p>
                    Add <code> .pagination-rounded</code> for rounded
                    pagination.
                  </p>
                  <nav>
                    <ul className="pagination pagination-rounded pagination-boxed mb-0 flex-wrap gap-lg-0 gap-md-0 gap-1">
                      <li className="page-item">
                        <Link
                          className="page-link"
                          to="#"
                          aria-label="Previous"
                        >
                          <span aria-hidden="true">«</span>
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          1
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          2
                        </Link>
                      </li>
                      <li className="page-item active">
                        <Link className="page-link" to="#">
                          3
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          4
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          5
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#" aria-label="Next">
                          <span aria-hidden="true">»</span>
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>{" "}
                {/* end card body */}
              </div>{" "}
              {/* end card */}
            </div>{" "}
            {/* end col */}
            <div className="col-xl-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title">Soft Pagination</h5>
                </div>
                <div className="card-body">
                  <p>
                    Add <code> .pagination-rounded</code> for rounded
                    pagination.
                  </p>
                  <nav>
                    <ul className="pagination pagination-soft-primary pagination-boxed mb-0 flex-wrap gap-lg-0 gap-md-0 gap-1">
                      <li className="page-item">
                        <Link
                          className="page-link"
                          to="#"
                          aria-label="Previous"
                        >
                          <i className="ti ti-chevron-left" />
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          1
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          2
                        </Link>
                      </li>
                      <li className="page-item active">
                        <Link className="page-link" to="#">
                          3
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          4
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          5
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#" aria-label="Next">
                          <i className="ti ti-chevron-right" />
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>{" "}
                {/* end card body */}
              </div>{" "}
              {/* end card */}
            </div>{" "}
            {/* end col */}
          </div>
          {/* end row */}
          {/* start row */}
          <div className="row">
            <div className="col-xl-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title">Custom Color Pagination</h5>
                </div>
                <div className="card-body">
                  <p>
                    Add <code> .pagination-boxed</code> for rounded pagination.
                  </p>
                  <nav>
                    <ul className="pagination pagination-boxed pagination-primary flex-wrap gap-lg-0 gap-md-0 gap-1 mb-3">
                      <li className="page-item">
                        <Link
                          className="page-link"
                          to="#"
                          aria-label="Previous"
                        >
                          <i className="ti ti-chevron-left" />
                        </Link>
                      </li>
                      <li className="page-item active">
                        <Link className="page-link" to="#">
                          1
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          2
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          3
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          4
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          5
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#" aria-label="Next">
                          <i className="ti ti-chevron-right align-middle" />
                        </Link>
                      </li>
                    </ul>
                  </nav>
                  <nav>
                    <ul className="pagination pagination-boxed pagination-secondary flex-wrap gap-lg-0 gap-md-0 gap-1 mb-3">
                      <li className="page-item">
                        <Link
                          className="page-link"
                          to="#"
                          aria-label="Previous"
                        >
                          <i className="ti ti-arrow-left" />
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          1
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          2
                        </Link>
                      </li>
                      <li className="page-item active">
                        <Link className="page-link" to="#">
                          3
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          4
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          5
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#" aria-label="Next">
                          <i className="ti ti-arrow-right" />
                        </Link>
                      </li>
                    </ul>
                  </nav>
                  <nav>
                    <ul className="pagination pagination-boxed pagination-dark mb-0 flex-wrap gap-lg-0 gap-md-0 gap-1">
                      <li className="page-item">
                        <Link
                          className="page-link"
                          to="#"
                          aria-label="Previous"
                        >
                          <i className="ti ti-chevron-left-pipe align-middle" />
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          1
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          2
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          3
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          4
                        </Link>
                      </li>
                      <li className="page-item active">
                        <Link className="page-link" to="#">
                          5
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#" aria-label="Next">
                          <i className="ti ti-chevron-right-pipe align-middle" />
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>{" "}
                {/* end card body */}
              </div>{" "}
              {/* end card */}
            </div>{" "}
            {/* end col */}
            <div className="col-xl-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title">Gradient Color Pagination</h5>
                </div>
                <div className="card-body">
                  <p>
                    Add <code> .pagination-boxed</code> for rounded pagination.
                  </p>
                  <nav>
                    <ul className="pagination pagination-boxed pagination-gradient pagination-primary flex-wrap gap-lg-0 gap-md-0 gap-1 mb-3">
                      <li className="page-item">
                        <Link
                          className="page-link"
                          to="#"
                          aria-label="Previous"
                        >
                          <i className="ti ti-chevron-left" />
                        </Link>
                      </li>
                      <li className="page-item active">
                        <Link className="page-link" to="#">
                          1
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          2
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          3
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          4
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          5
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#" aria-label="Next">
                          <i className="ti ti-chevron-right align-middle" />
                        </Link>
                      </li>
                    </ul>
                  </nav>
                  <nav>
                    <ul className="pagination pagination-boxed pagination-secondary pagination-gradient flex-wrap gap-lg-0 gap-md-0 gap-1 mb-3">
                      <li className="page-item">
                        <Link
                          className="page-link"
                          to="#"
                          aria-label="Previous"
                        >
                          <i className="ti ti-arrow-left" />
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          1
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          2
                        </Link>
                      </li>
                      <li className="page-item active">
                        <Link className="page-link" to="#">
                          3
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          4
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          5
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#" aria-label="Next">
                          <i className="ti ti-arrow-right" />
                        </Link>
                      </li>
                    </ul>
                  </nav>
                  <nav>
                    <ul className="pagination pagination-boxed pagination-dark pagination-gradient mb-0 flex-wrap gap-lg-0 gap-md-0 gap-1">
                      <li className="page-item">
                        <Link
                          className="page-link"
                          to="#"
                          aria-label="Previous"
                        >
                          <i className="ti ti-chevron-left-pipe align-middle" />
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          1
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          2
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          3
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#">
                          4
                        </Link>
                      </li>
                      <li className="page-item active">
                        <Link className="page-link" to="#">
                          5
                        </Link>
                      </li>
                      <li className="page-item">
                        <Link className="page-link" to="#" aria-label="Next">
                          <i className="ti ti-chevron-right-pipe align-middle" />
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>{" "}
                {/* end card body */}
              </div>{" "}
              {/* end card */}
            </div>{" "}
            {/* end col */}
          </div>
          {/* end row */}
        </div>
        {/* End Content */}
        {/* Start Footer */}
       <CommonFooter/>
        {/* End Footer */}
      </div>
      {/* ========================
			End Page Content
		========================= */}
    </>
  );
};

export default Pagination;
